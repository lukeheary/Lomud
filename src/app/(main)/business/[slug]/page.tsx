"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/calendar/event-card";
import {
  Building2,
  MapPin,
  Globe,
  Instagram,
  Heart,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch business data
  const { data: business, isLoading } = trpc.business.getBusinessBySlug.useQuery(
    { slug }
  );

  // Check if following
  const { data: isFollowing } = trpc.business.isFollowing.useQuery(
    { businessId: business?.id || "" },
    { enabled: !!business?.id }
  );

  // Follow mutation
  const followMutation = trpc.business.followBusiness.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this business",
      });
      utils.business.isFollowing.invalidate();
      utils.business.getBusinessBySlug.invalidate();
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
  const unfollowMutation = trpc.business.unfollowBusiness.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You unfollowed this business",
      });
      utils.business.isFollowing.invalidate();
      utils.business.getBusinessBySlug.invalidate();
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
    if (!business) return;

    if (isFollowing) {
      unfollowMutation.mutate({ businessId: business.id });
    } else {
      followMutation.mutate({ businessId: business.id });
    }
  };

  const isOwner = userId === business?.createdByUserId;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Business not found</h2>
        <p className="text-muted-foreground mb-4">
          The business you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/businesses">
          <Button>Browse Businesses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Business Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">{business.name}</h1>
                </div>
                {business.description && (
                  <p className="text-muted-foreground">{business.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {business.city}, {business.state}
                  </span>
                </div>
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>@{business.instagram}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  <Heart className="h-3 w-3 mr-1" />
                  {(business as any).follows?.length || 0} followers
                </Badge>
                <Badge variant="outline">
                  {(business as any).events?.length || 0} events
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && (
                <Link href={`/business/${slug}/events/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
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
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {(business as any).events && (business as any).events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(business as any).events.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No upcoming events scheduled
              </p>
              {isOwner && (
                <Link href={`/business/${slug}/events/new`}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
