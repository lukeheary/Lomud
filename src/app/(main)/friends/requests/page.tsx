"use client";

import { Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserList } from "@/components/user-list";

function RequestsPageContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: pendingRequests, isLoading } =
    trpc.friends.listFriends.useQuery({
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
      <div className="flex items-center gap-2">
        <Link href="/friends">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Friend Requests
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Received Requests */}
          <div className="space-y-3">
            {receivedRequests.length === 0 ? (
              <div className="py-8 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No pending friend requests
                </p>
              </div>
            ) : (
                <UserList
                  items={receivedRequests}
                  getUser={(req) => ({
                    id: req.friend?.id || "",
                    firstName: req.friend?.firstName || null,
                    lastName: req.friend?.lastName || null,
                    username: req.friend?.username || null,
                    imageUrl: req.friend?.imageUrl || null,
                  })}
                  renderAction={(request) => (
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
                  )}
                />
            )}
          </div>

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Sent Requests</h2>
                <UserList
                  items={sentRequests}
                  getUser={(req) => ({
                    id: req.friend?.id || "",
                    firstName: req.friend?.firstName || null,
                    lastName: req.friend?.lastName || null,
                    username: req.friend?.username || null,
                    imageUrl: req.friend?.imageUrl || null,
                  })}
                  renderAction={() => (
                    <Badge variant="outline">Pending</Badge>
                  )}
                />
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
