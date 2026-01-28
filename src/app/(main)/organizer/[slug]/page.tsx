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
import pluralize from "pluralize";

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
    <div className="container mx-auto space-y-4 py-4">
      {/* Organizer Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-bold md:text-3xl">
                  {organizer.name}
                </h1>
                {organizer.description && (
                  <p className="mt-2 text-muted-foreground">
                    {organizer.description}
                  </p>
                )}
              </div>
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className="w-full shrink-0 sm:w-auto"
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    isFollowing ? "fill-current" : ""
                  }`}
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
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
                {(organizer as any).follows?.length || 0}{" "}
                {pluralize("follower", (organizer as any).follows?.length || 0)}
              </Badge>
              {/*<Badge variant="outline">*/}
              {/*  {(organizer as any).events?.length || 0}{" "}*/}
              {/*  {pluralize("event", (organizer as any).events?.length || 0)}*/}
              {/*</Badge>*/}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={"border-none bg-background"}>
        <CardHeader className={"px-0 md:px-6 md:pb-0 md:pt-6"}>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className={"px-0 md:p-6"}>
          {organizer.events && organizer.events.length > 0 ? (
            <EventCardGrid
              events={organizer.events as any}
              columns={{ mobile: 1, tablet: 3, desktop: 4 }}
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

      {/* Previous Events */}
      {organizer.pastEvents && (organizer.pastEvents as any[]).length > 0 && (
        <Card className={"border-none bg-background"}>
          <CardHeader className={"px-0 md:px-6 md:pb-0 md:pt-6"}>
            <CardTitle>Previous Events</CardTitle>
          </CardHeader>
          <CardContent className={"px-0 md:p-6"}>
            <EventCardGrid
              events={organizer.pastEvents as any}
              columns={{ mobile: 1, tablet: 3, desktop: 4 }}
              gap="md"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
