"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCardGrid } from "@/components/events/event-card-grid";
import { MapPin, Globe, Instagram, Heart, Loader2, Building, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { VenueHoursDisplay } from "@/components/venue-hours-display";
import { VenueHours } from "@/components/venue-hours-editor";
import pluralize from "pluralize";

export default function PlacePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch place data
  const { data: place, isLoading } = trpc.place.getPlaceBySlug.useQuery({
    slug,
  });

  // Check if following
  const { data: isFollowing } = trpc.place.isFollowingPlace.useQuery(
    { placeId: place?.id || "" },
    { enabled: !!place?.id }
  );

  // Follow mutation
  const followMutation = trpc.place.followPlace.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `You are now following this ${place?.type === "venue" ? "venue" : "organizer"}`,
      });
      utils.place.isFollowingPlace.invalidate();
      utils.place.getPlaceBySlug.invalidate();
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
  const unfollowMutation = trpc.place.unfollowPlace.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `You unfollowed this ${place?.type === "venue" ? "venue" : "organizer"}`,
      });
      utils.place.isFollowingPlace.invalidate();
      utils.place.getPlaceBySlug.invalidate();
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
    if (!place) return;

    if (isFollowing) {
      unfollowMutation.mutate({ placeId: place.id });
    } else {
      followMutation.mutate({ placeId: place.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Place not found</h2>
        <p className="mb-4 text-muted-foreground">
          The place you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/places">
          <Button>Browse Places</Button>
        </Link>
      </div>
    );
  }

  const isVenue = place.type === "venue";
  const TypeIcon = isVenue ? Building : Building2;

  return (
    <div className="container mx-auto space-y-4 py-4">
      {/* Place Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold md:text-3xl">{place.name}</h1>
                </div>
                {place.description && (
                  <p className="mt-2 text-muted-foreground">
                    {place.description}
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
              {(place.city || place.address) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {place.city && place.state ? `${place.city}, ${place.state}` : place.address}
                  </span>
                </div>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
              {place.instagram && (
                <a
                  href={`https://instagram.com/${place.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@{place.instagram}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <TypeIcon className="mr-1 h-3 w-3" />
                {isVenue ? "Venue" : "Organizer"}
              </Badge>
              <Badge variant="outline">
                <Heart className="mr-1 h-3 w-3" />
                {(place as any).follows?.length || 0}{" "}
                {pluralize("follower", (place as any).follows?.length || 0)}
              </Badge>
              <Badge variant="outline">
                {(place as any).events?.length || 0}{" "}
                {pluralize("event", (place as any).events?.length || 0)}
              </Badge>
            </div>

            {isVenue && (place as any).hours && (
              <VenueHoursDisplay hours={(place as any).hours as VenueHours} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={"border-none bg-background"}>
        <CardHeader className={"px-0 md:px-6 md:pb-0 md:pt-6"}>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className={"px-0 md:p-6"}>
          {place.events && place.events.length > 0 ? (
            <EventCardGrid
              events={place.events}
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
      {place.pastEvents && (place.pastEvents as any[]).length > 0 && (
        <Card className={"border-none bg-background"}>
          <CardHeader className={"px-0 md:px-6 md:pb-0 md:pt-6"}>
            <CardTitle>Previous Events</CardTitle>
          </CardHeader>
          <CardContent className={"px-0 md:p-6"}>
            <EventCardGrid
              events={place.pastEvents as any}
              columns={{ mobile: 1, tablet: 3, desktop: 4 }}
              gap="md"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
