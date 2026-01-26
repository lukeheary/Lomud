"use client";

import { Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function RequestsPageContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: pendingRequests, isLoading } = trpc.friends.listFriends.useQuery({
    statusFilter: "pending",
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

  const sentRequests = pendingRequests?.filter((f) => f.isSender) || [];
  const receivedRequests = pendingRequests?.filter((f) => !f.isSender) || [];

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Friend Requests
        </h1>
        <p className="text-muted-foreground">
          Manage your pending friend requests
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Received Requests */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Received Requests</h2>
            {receivedRequests.length === 0 ? (
              <div className="py-8 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No pending friend requests
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                          {request.friend?.firstName} {request.friend?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.friend?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
          </div>

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Sent Requests</h2>
              <div className="space-y-3">
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
                          {request.friend?.firstName} {request.friend?.lastName}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RequestsPage() {
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
      <RequestsPageContent />
    </Suspense>
  );
}
