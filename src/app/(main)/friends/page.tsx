"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Mail,
  Loader2,
  ChevronRight,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { ActivityFeed } from "@/components/friends/activity-feed";
import { useToast } from "@/hooks/use-toast";
import { useQueryState } from "nuqs";
import pluralize from "pluralize";

function FriendsPageContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });

  // Fetch friends
  const { data: friends } = trpc.friends.listFriends.useQuery({});
  const { data: pendingRequests } = trpc.friends.listFriends.useQuery({
    statusFilter: "pending",
  });

  // Search users (includes friends and non-friends)
  const { data: searchResults, isLoading: searchLoading } =
    trpc.friends.searchUsers.useQuery(
      { query: searchQuery, limit: 20, includeAll: true },
      { enabled: searchQuery.length >= 2 }
    );

  // Recent users (for when search is focused but no query)
  const { data: recentUsers, isLoading: recentLoading } =
    trpc.friends.getRecentUsers.useQuery(
      { limit: 20, cursor: 0 },
      { enabled: isSearchMode && searchQuery.length < 2 }
    );

  const acceptedFriends = friends?.filter((f) => f.status === "accepted") || [];
  const receivedRequests = pendingRequests?.filter((f) => !f.isSender) || [];

  // Mutations
  const sendRequestMutation = trpc.friends.sendFriendRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent",
      });
      utils.friends.searchUsers.invalidate();
      utils.friends.getRecentUsers.invalidate();
      utils.friends.listFriends.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptMutation = trpc.friends.acceptFriendRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends",
      });
      utils.friends.listFriends.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = trpc.friends.rejectFriendRequest.useMutation({
    onSuccess: () => {
      toast({ title: "Friend request rejected" });
      utils.friends.listFriends.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a user in search results is already a friend
  const isFriend = (userId: string) => {
    return acceptedFriends.some((f) => f.friend?.id === userId);
  };

  // Sort search results: friends first, then others
  const sortedSearchResults = searchResults
    ? [...searchResults].sort((a, b) => {
        const aIsFriend = isFriend(a.id);
        const bIsFriend = isFriend(b.id);
        if (aIsFriend && !bIsFriend) return -1;
        if (!aIsFriend && bIsFriend) return 1;
        return 0;
      })
    : [];

  const handleExitSearch = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    searchInputRef.current?.blur();
  };

  const isSearching = searchQuery.length >= 2;

  // User list item component for reuse
  const UserListItem = ({
    user,
    showAddButton = true,
  }: {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      imageUrl: string | null;
    };
    showAddButton?: boolean;
  }) => {
    const userIsFriend = isFriend(user.id);
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.imageUrl || undefined} />
            <AvatarFallback>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              {userIsFriend && (
                <Badge variant="secondary" className="text-xs">
                  Friend
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        {showAddButton && !userIsFriend && (
          <Button
            size="sm"
            onClick={() =>
              sendRequestMutation.mutate({ friendUserId: user.id })
            }
            disabled={sendRequestMutation.isPending}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto space-y-4 py-4">
      {/*<div>*/}
      {/*  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">*/}
      {/*    Friends*/}
      {/*  </h1>*/}
      {/*  <p className="text-muted-foreground">*/}
      {/*    Connect with friends and see what they&apos;re up to*/}
      {/*  </p>*/}
      {/*</div>*/}

      {/* Search */}
      <Suspense fallback={null}>
        <SearchInput
          ref={searchInputRef}
          placeholder="Search friends or find new people..."
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => setIsSearchMode(true)}
          showBack={isSearchMode}
          onBack={handleExitSearch}
          className="w-full"
        />
      </Suspense>

      {isSearchMode ? (
        // Search Mode View
        <div className="space-y-3">
          {isSearching ? (
            // Search Results
            <>
              {searchLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sortedSearchResults.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {sortedSearchResults.length}{" "}
                    {pluralize("result", sortedSearchResults.length)}
                  </p>
                  {sortedSearchResults.map((user) => (
                    <UserListItem key={user.id} user={user} />
                  ))}
                </>
              )}
            </>
          ) : (
            // Recent Users (when focused but no query)
            <>
              <div>
                <h2 className="text-lg font-semibold">Recent Members</h2>
                <p className="text-sm text-muted-foreground">
                  People who recently joined
                </p>
              </div>
              {recentLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !recentUsers?.items || recentUsers.items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No recent members to show
                </div>
              ) : (
                recentUsers.items.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))
              )}
            </>
          )}
        </div>
      ) : (
        // Default View
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/friends/list">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-primary/10 md:flex">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="flex flex-row items-baseline gap-2 pl-2 text-base font-medium md:pl-0">
                      <span className={"text-xl"}>
                        {acceptedFriends.length}
                      </span>
                      {pluralize("Friend", acceptedFriends.length)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/friends/requests">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-primary/10 md:flex">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex flex-row items-baseline gap-2 pl-2 text-base font-medium md:pl-0">
                        <span className={"text-xl"}>
                          {receivedRequests.length}
                        </span>
                        {pluralize("Request", receivedRequests.length)}
                      </p>
                      {receivedRequests.length > 0 && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Pending Requests Preview */}
          {receivedRequests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Friend Requests</CardTitle>
                  <Link href="/friends/requests">
                    <Button variant="ghost" size="sm">
                      View all
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {receivedRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={request.friend?.imageUrl || undefined}
                        />
                        <AvatarFallback>
                          {request.friend?.firstName?.[0]}
                          {request.friend?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {request.friend?.firstName} {request.friend?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{request.friend?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          rejectMutation.mutate({ friendRequestId: request.id })
                        }
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          acceptMutation.mutate({ friendRequestId: request.id })
                        }
                        disabled={acceptMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Activity</h2>
            <ActivityFeed />
          </div>
        </>
      )}
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <FriendsPageContent />
    </Suspense>
  );
}
