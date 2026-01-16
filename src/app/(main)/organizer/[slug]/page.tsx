"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCardGrid } from "@/components/events/event-card-grid";
import { Users, Globe, Instagram, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";

export default function OrganizerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch organizer data
  const { data: organizer, isLoading } =
    trpc.organizer.getOrganizerBySlug.useQuery({ slug });

  // Check if following
  const { data: isFollowing } = trpc.organizer.isFollowingOrganizer.useQuery(
    { organizerId: organizer?.id || "" },
    { enabled: !!organizer?.id }
  );

  // Follow mutation
  const followMutation = trpc.organizer.followOrganizer.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this organizer",
      });
      utils.organizer.isFollowingOrganizer.invalidate();
      utils.organizer.getOrganizerBySlug.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = trpc.organizer.unfollowOrganizer.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You unfollowed this organizer",
      });
      utils.organizer.isFollowingOrganizer.invalidate();
      utils.organizer.getOrganizerBySlug.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = () => {
    if (!organizer) return;

    if (isFollowing) {
      unfollowMutation.mutate({ organizerId: organizer.id });
    } else {
      followMutation.mutate({ organizerId: organizer.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Organizer not found</h2>
        <p className="mb-4 text-muted-foreground">
          The organizer you&apos;re looking for doesn&apos;t exist
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Organizer Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">{organizer.name}</h1>
                </div>
                {organizer.description && (
                  <p className="text-muted-foreground">
                    {organizer.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {organizer.website && (
                  <a
                    href={organizer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
                {organizer.instagram && (
                  <a
                    href={`https://instagram.com/${organizer.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>@{organizer.instagram}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  <Heart className="mr-1 h-3 w-3" />
                  {(organizer as any).follows?.length || 0} followers
                </Badge>
                <Badge variant="outline">
                  {(organizer as any).events?.length || 0} events
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    isFollowing ? "fill-current" : ""
                  }`}
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className={"border-none bg-background"}>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {(organizer as any).events && (organizer as any).events.length > 0 ? (
            <EventCardGrid
              events={(organizer as any).events}
              columns={{ mobile: 2, desktop: 4 }}
              gap="md"
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No upcoming events scheduled
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
