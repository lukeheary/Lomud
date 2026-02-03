"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCardGrid } from "@/components/events/event-card-grid";
import {
  MapPin,
  Globe,
  Instagram,
  Heart,
  Loader2,
  Building,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { VenueHoursDisplay } from "@/components/venue-hours-display";
import { VenueHours } from "@/components/venue-hours-editor";
import pluralize from "pluralize";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="min-h-screen bg-background pb-8">
      {/* Banner Area */}
      <div className="mx-auto w-full max-w-4xl lg:px-4 lg:pt-4">
        <div className="relative h-32 w-full overflow-hidden bg-muted md:h-48 lg:rounded-2xl">
          <div className="h-full w-full bg-gradient-to-r from-primary/10 to-primary/30" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="relative pb-6">
          <div className="flex items-start justify-between">
            {/* Logo/Avatar */}
            <div className="-mt-12 md:-mt-16">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md md:h-32 md:w-32">
                {place.imageUrl ? (
                  <AvatarImage
                    src={place.imageUrl}
                    alt={place.name}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-secondary text-2xl font-bold">
                  {place.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Action Buttons (Follow) */}
            <div className="mt-4">
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className="rounded-full font-bold"
              >
                {isFollowing ? (
                  <>
                    <Heart className="mr-2 h-4 w-4 fill-current" />
                    Following
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Place Info */}
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {place.name}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground md:text-base">
                @{place.slug}
              </p>

              {place.description && (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-normal">
                  {place.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TypeIcon className="h-4 w-4" />
                <span>{isVenue ? "Venue" : "Organizer"}</span>
              </div>
              {(place.city || place.address) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {place.city && place.state
                      ? `${place.city}, ${place.state}`
                      : place.address}
                  </span>
                </div>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
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
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@{place.instagram}</span>
                </a>
              )}
            </div>

            {place.categories && place.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {place.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold">
                  {(place as any).follows?.length || 0}
                </span>
                <span className="text-muted-foreground">
                  {pluralize("follower", (place as any).follows?.length || 0)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">
                  {(place as any).events?.length || 0}
                </span>
                <span className="text-muted-foreground">
                  {pluralize("event", (place as any).events?.length || 0)}
                </span>
              </div>
            </div>

            {isVenue && (place as any).hours && (
              <div className="border-t pt-4">
                <VenueHoursDisplay hours={(place as any).hours as VenueHours} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-0 pt-8">
        <h2 className="px-4 pb-4 text-2xl font-bold md:px-0">Upcoming Events</h2>
        <div className="px-4 md:px-0">
          {place.events && place.events.length > 0 ? (
            <EventCardGrid
              events={place.events}
              columns={{ mobile: 1, tablet: 3, desktop: 3 }}
              gap="md"
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No upcoming events scheduled
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Previous Events */}
      {place.pastEvents && (place.pastEvents as any[]).length > 0 && (
        <div className="mx-auto max-w-4xl px-0 pt-8">
          <h2 className="px-4 pb-4 text-2xl font-bold md:px-0">Previous Events</h2>
          <div className="px-4 md:px-0">
            <EventCardGrid
              events={place.pastEvents as any}
              columns={{ mobile: 1, tablet: 3, desktop: 3 }}
              gap="md"
            />
          </div>
        </div>
      )}
    </div>
  );
}
