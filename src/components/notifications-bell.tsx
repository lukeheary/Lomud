"use client";

import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function NotificationsBell() {
  const { toast } = useToast();
  const { data: pendingRequests, refetch } = trpc.friends.getPendingRequests.useQuery();

  const acceptMutation = trpc.friends.acceptFriendRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
      refetch();
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
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasNotifications = (pendingRequests?.length ?? 0) > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
              {pendingRequests!.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {hasNotifications && (
              <span className="text-xs text-muted-foreground">
                {pendingRequests!.length} new
              </span>
            )}
          </div>

          {!hasNotifications ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {pendingRequests!.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.user.imageUrl || undefined} />
                    <AvatarFallback>
                      {request.user.firstName?.[0]}
                      {request.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium">
                        {request.user.firstName} {request.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{request.user.username}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          acceptMutation.mutate({
                            friendRequestId: request.id,
                          })
                        }
                        disabled={
                          acceptMutation.isPending || rejectMutation.isPending
                        }
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          rejectMutation.mutate({
                            friendRequestId: request.id,
                          })
                        }
                        disabled={
                          acceptMutation.isPending || rejectMutation.isPending
                        }
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
