"use client";

import { Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function FriendsListContent() {
  const { data: friends, isLoading } = trpc.friends.listFriends.useQuery({});
  const acceptedFriends = friends?.filter((f) => f.status === "accepted") || [];

  return (
    <div className="container mx-auto space-y-4 py-4">
      <div className="flex items-center gap-4">
        <Link href="/friends">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            My Friends
          </h1>
          <p className="text-muted-foreground">
            People you&apos;re connected with
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : acceptedFriends.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">
            You don&apos;t have any friends yet
          </p>
          <p className="text-sm text-muted-foreground">
            Use the Find Friends page to connect with people
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {acceptedFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={friend.friend?.imageUrl || undefined} />
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
    </div>
  );
}

export default function FriendsListPage() {
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
      <FriendsListContent />
    </Suspense>
  );
}
