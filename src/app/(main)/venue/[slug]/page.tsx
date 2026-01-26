"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCardGrid } from "@/components/events/event-card-grid";
import { MapPin, Globe, Instagram, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { VenueHoursDisplay } from "@/components/venue-hours-display";
import { VenueHours } from "@/components/venue-hours-editor";

export default function VenuePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch venue data
  const { data: venue, isLoading } = trpc.venue.getVenueBySlug.useQuery({
    slug,
  });

  // Check if following
  const { data: isFollowing } = trpc.venue.isFollowingVenue.useQuery(
    { venueId: venue?.id || "" },
    { enabled: !!venue?.id }
  );

  // Follow mutation
  const followMutation = trpc.venue.followVenue.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this venue",
      });
      utils.venue.isFollowingVenue.invalidate();
      utils.venue.getVenueBySlug.invalidate();
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
  const unfollowMutation = trpc.venue.unfollowVenue.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You unfollowed this venue",
      });
      utils.venue.isFollowingVenue.invalidate();
      utils.venue.getVenueBySlug.invalidate();
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
    if (!venue) return;

    if (isFollowing) {
      unfollowMutation.mutate({ venueId: venue.id });
    } else {
      followMutation.mutate({ venueId: venue.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto py-12 text-center">
        {/*<Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />*/}
        <h2 className="mb-2 text-2xl font-bold">Venue not found</h2>
        <p className="mb-4 text-muted-foreground">
          The venue you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/venues-and-organizers">
          <Button>Browse Venues</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Venue Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{venue.name}</h1>
                {venue.description && (
                  <p className="mt-2 text-muted-foreground">{venue.description}</p>
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
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {venue.city}, {venue.state}
                </span>
              </div>
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
              {venue.instagram && (
                <a
                  href={`https://instagram.com/${venue.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@{venue.instagram}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Heart className="mr-1 h-3 w-3" />
                {(venue as any).follows?.length || 0} followers
              </Badge>
              <Badge variant="outline">
                {(venue as any).events?.length || 0} events
              </Badge>
            </div>

            {(venue as any).hours && (
              <VenueHoursDisplay
                hours={(venue as any).hours as VenueHours}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className={"border-none bg-background"}>
        <CardHeader className={"px-0 md:px-6 md:pb-0 md:pt-6"}>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className={"px-0 md:p-6"}>
          {(venue as any).events && (venue as any).events.length > 0 ? (
            <EventCardGrid
              events={(venue as any).events}
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
    </div>
  );
}
