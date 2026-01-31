"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { useNavbarSearch } from "@/contexts/nav-search-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserList } from "@/components/user-list";

function FriendsPageContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { setShowNavbarSearch, registerScrollToSearch } = useNavbarSearch();
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });

  // Scroll to top and focus search input when navbar search button is clicked
  const scrollToSearchAndFocus = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    searchInputRef.current?.focus();
  }, []);

  // Register the scroll callback with the navbar context
  useEffect(() => {
    registerScrollToSearch(scrollToSearchAndFocus);
  }, [registerScrollToSearch, scrollToSearchAndFocus]);

  // Update navbar search button visibility based on scroll position
  useEffect(() => {
    setShowNavbarSearch(isSticky);
  }, [isSticky, setShowNavbarSearch]);

  // Observe when the search section scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" }
    );

    const sentinel = stickySentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

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

  return (
    <div className="container mx-auto py-4">
      {/* Sticky sentinel for intersection observer */}
      <div ref={stickySentinelRef} className="h-0" />

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex-1">
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
        </div>

        {!isSearchMode && (
          <div className="grid grid-cols-2 gap-2 md:flex md:w-auto">
            <Link href="/friends/list" className="md:w-32 lg:w-40">
              <Card className="cursor-pointer rounded-full bg-muted transition-colors hover:bg-muted/80">
                <CardContent className="flex h-12 items-center justify-between px-4 py-0">
                  <div className="flex items-center gap-2">
                    <p className="flex flex-row items-center gap-1.5 text-base font-medium lg:text-lg">
                      <span>{acceptedFriends.length}</span>
                      <span className={"text-sm text-muted-foreground"}>
                        {pluralize("Friend", acceptedFriends.length)}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground lg:h-5 lg:w-5" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/friends/requests" className="md:w-32 lg:w-40">
              <Card className="cursor-pointer rounded-full bg-muted transition-colors hover:bg-muted/80">
                <CardContent className="flex h-12 items-center justify-between px-4 py-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <p className="flex flex-row items-center gap-1.5 text-base font-medium lg:text-lg">
                        <span>{receivedRequests.length}</span>
                        <span className={"text-sm text-muted-foreground"}>
                          {pluralize("Request", receivedRequests.length)}
                        </span>
                      </p>
                      {receivedRequests.length > 0 && (
                        <Badge
                          variant="default"
                          className="px-1 py-0 text-[10px] md:text-xs"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground lg:h-5 lg:w-5" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>

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
                  <UserList
                    items={sortedSearchResults}
                    getUser={(user) => user}
                    renderBadges={(user) =>
                      isFriend(user.id) ? (
                        <Badge variant="secondary" className="text-xs">
                          Friend
                        </Badge>
                      ) : null
                    }
                    renderAction={(user) =>
                      !isFriend(user.id) ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            sendRequestMutation.mutate({
                              friendUserId: user.id,
                            })
                          }
                          disabled={sendRequestMutation.isPending}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      ) : null
                    }
                  />
                </>
              )}
            </>
          ) : (
            // Recent Users (when focused but no query)
            <>
              <div>
                <h2 className="text-lg font-semibold">Recently Joined</h2>
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
                <UserList
                  items={recentUsers.items}
                  getUser={(user) => user}
                  renderBadges={(user) =>
                    isFriend(user.id) ? (
                      <Badge variant="secondary" className="text-xs">
                        Friend
                      </Badge>
                    ) : null
                  }
                  renderAction={(user) =>
                    !isFriend(user.id) ? (
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
                    ) : null
                  }
                />
              )}
            </>
          )}
        </div>
      ) : (
        // Default View
        <>
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
                <UserList
                  items={receivedRequests.slice(0, 3)}
                  getUser={(req) => ({
                    id: req.friend?.id || "",
                    firstName: req.friend?.firstName || null,
                    lastName: req.friend?.lastName || null,
                    username: req.friend?.username || null,
                    imageUrl: req.friend?.imageUrl || null,
                  })}
                  renderAction={(request) => (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          rejectMutation.mutate({
                            friendRequestId: request.id,
                          })
                        }
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          acceptMutation.mutate({
                            friendRequestId: request.id,
                          })
                        }
                        disabled={acceptMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <div className={"pt-4"}>
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
