"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserPlus, Check, X, Loader2, Mail, Activity } from "lucide-react";
import { ActivityFeed } from "@/components/friends/activity-feed";
import { useToast } from "@/hooks/use-toast";
import { useQueryState } from "nuqs";
import { Suspense } from "react";

function FriendsPageContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });

  // Fetch friends
  const { data: friends, isLoading: friendsLoading } =
    trpc.friends.listFriends.useQuery({});

  // Fetch pending requests
  const { data: pendingRequests } = trpc.friends.listFriends.useQuery({
    statusFilter: "pending",
  });

  // Search users
  const { data: searchResults, isLoading: searchLoading } =
    trpc.friends.searchUsers.useQuery(
      { query: searchQuery, limit: 10 },
      { enabled: searchQuery.length >= 2 }
    );

  // Send friend request mutation
  const sendRequestMutation = trpc.friends.sendFriendRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent",
      });
      utils.friends.searchUsers.invalidate();
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

  // Accept friend request mutation
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

  // Reject friend request mutation
  const rejectMutation = trpc.friends.rejectFriendRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
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

  const acceptedFriends = friends?.filter((f) => f.status === "accepted") || [];
  const sentRequests = pendingRequests?.filter((f) => f.isSender) || [];
  const receivedRequests = pendingRequests?.filter((f) => !f.isSender) || [];

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Friends
        </h1>
        <p className="text-muted-foreground">
          Manage your friends and see what events they&apos;re attending
        </p>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Friends
            {acceptedFriends.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {acceptedFriends.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Requests
            {receivedRequests.length > 0 && (
              <Badge variant="default" className="ml-1">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Friends
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Friend Activity</CardTitle>
              <CardDescription>
                See what your friends are up to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Friends Tab */}
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : acceptedFriends.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">
                    You don&apos;t have any friends yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Use the &quot;Find Friends&quot; tab to connect with people
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={friend.friend?.imageUrl || undefined}
                          />
                          <AvatarFallback>
                            {friend.friend?.firstName?.[0]}
                            {friend.friend?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {friend.friend?.firstName} {friend.friend?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{friend.friend?.username}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Friends</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Received Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {receivedRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No pending friend requests
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={request.friend?.imageUrl || undefined}
                          />
                          <AvatarFallback>
                            {request.friend?.firstName?.[0]}
                            {request.friend?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.friend?.firstName}{" "}
                            {request.friend?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.friend?.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            rejectMutation.mutate({
                              friendRequestId: request.id,
                            })
                          }
                          disabled={rejectMutation.isPending}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            acceptMutation.mutate({
                              friendRequestId: request.id,
                            })
                          }
                          disabled={acceptMutation.isPending}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={request.friend?.imageUrl || undefined}
                          />
                          <AvatarFallback>
                            {request.friend?.firstName?.[0]}
                            {request.friend?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.friend?.firstName}{" "}
                            {request.friend?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.friend?.username}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/*<Suspense fallback={null}>*/}
              {/*  <SearchInput*/}
              {/*    placeholder="Search by name, username, or email..."*/}
              {/*    value={searchQuery}*/}
              {/*    onChange={setSearchQuery}*/}
              {/*  />*/}
              {/*</Suspense>*/}

              {searchQuery.length < 2 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Enter at least 2 characters to search
                </div>
              ) : searchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !searchResults || searchResults.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.imageUrl || undefined} />
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          sendRequestMutation.mutate({ friendUserId: user.id })
                        }
                        disabled={sendRequestMutation.isPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
