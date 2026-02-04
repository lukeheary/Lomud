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
  Edit,
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

  // Check if user is admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  // Get current user
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

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

  // Check if user can edit this place (admin or member)
  const isMember =
    currentUser &&
    place.members?.some((member: any) => member.userId === currentUser.id);
  const canEdit = isAdmin || isMember;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Banner Area */}
      <div className="relative mx-auto h-32 w-full max-w-4xl overflow-hidden bg-secondary md:h-64 lg:mt-4 lg:rounded-2xl">
        {/* Banner placeholder - could be replaced with an actual image */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />

        {/* Edit Button - top right of banner */}
        <div className="absolute right-4 top-4 flex gap-2">
          {canEdit && (
            <Link href={`/places/${slug}/edit`}>
              <Button size="icon" variant="secondary" className="h-10 w-10">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="relative">
          {/* Profile Avatar - overlapping the banner */}
          <div className="-mt-16 flex items-end justify-between md:-mt-24">
            <Avatar className="h-32 w-32 border-4 border-background shadow-md md:h-48 md:w-48">
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

            {/* Action Buttons (Follow) - aligned with bottom of avatar */}
            <div className="mb-2">
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className="rounded-full"
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
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {place.name}
                </h1>
              </div>
              <p className="text-muted-foreground md:text-base">
                @{place.slug}
              </p>

              {place.description && (
                <p className="mt-3 whitespace-pre-wrap leading-normal">
                  {place.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-x-4 gap-y-2 text-muted-foreground">
              {/*<div className="flex items-center gap-1">*/}
              {/*  <TypeIcon className="h-4 w-4" />*/}
              {/*  <span>{isVenue ? "Venue" : "Organizer"}</span>*/}
              {/*</div>*/}
              {isVenue ? (
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  {/*<MapPin className="h-4 w-4" />*/}
                  <span>{place.address}</span>
                </div>
              ) : place.city && place.state ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {place.city}, {place.state}
                  </span>
                </div>
              ) : null}

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

              {isVenue && (place as any).hours && (
                <VenueHoursDisplay hours={(place as any).hours as VenueHours} />
              )}
            </div>

            {place.categories && place.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {place.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="capitalize">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            {/*<div className="flex items-center gap-4 text-sm">*/}
            {/*  <div className="flex items-center gap-1">*/}
            {/*    <span className="font-bold">*/}
            {/*      {(place as any).follows?.length || 0}*/}
            {/*    </span>*/}
            {/*    <span className="text-muted-foreground">*/}
            {/*      {pluralize("follower", (place as any).follows?.length || 0)}*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*  <div className="flex items-center gap-1">*/}
            {/*    <span className="font-bold">*/}
            {/*      {(place as any).events?.length || 0}*/}
            {/*    </span>*/}
            {/*    <span className="text-muted-foreground">*/}
            {/*      {pluralize("event", (place as any).events?.length || 0)}*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*</div>*/}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-0 pt-8">
        <h2 className="px-4 pb-4 text-xl font-bold md:px-0">Upcoming Events</h2>
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
          <h2 className="px-4 pb-4 text-xl font-bold md:px-0">
            Previous Events
          </h2>
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
