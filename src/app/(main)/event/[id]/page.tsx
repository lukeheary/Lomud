"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Building2,
  Loader2,
  Heart,
  Share2,
  Clock,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type RsvpStatus = "going" | "interested" | "not_going";

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch event data
  const { data: event, isLoading } = trpc.event.getEventById.useQuery({
    eventId,
  });

  // Fetch attendees
  const { data: attendees } = trpc.event.listEventAttendees.useQuery({
    eventId,
  });

  // RSVP mutation
  const rsvpMutation = trpc.event.setRsvpStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "RSVP Updated",
        description: "Your RSVP has been updated successfully",
      });
      utils.event.getEventById.invalidate();
      utils.event.listEventAttendees.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (status: RsvpStatus) => {
    rsvpMutation.mutate({ eventId, status });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <p className="text-muted-foreground mb-4">
          The event you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/">
          <Button>Back to Calendar</Button>
        </Link>
      </div>
    );
  }

  const goingCount = attendees?.filter((a) => a.status === "going").length || 0;
  const interestedCount =
    attendees?.filter((a) => a.status === "interested").length || 0;

  const eventDate = new Date(event.startAt);
  const dayOfWeek = format(eventDate, "EEEE");
  const monthDay = format(eventDate, "MMMM d, yyyy");
  const time = format(eventDate, "h:mm a zzz");

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Image and Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Event Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Calendar className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Title & Basic Info */}
            <div>
              <div className="mb-4 flex items-start justify-between">
                <h1 className="text-4xl font-bold">{event.title}</h1>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {event.venueName && (
                <div className="mb-2 flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{event.venueName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {dayOfWeek}, {monthDay}, {time}
                </span>
              </div>

              {event.business && (
                <Link
                  href={`/business/${event.business.slug}`}
                  className="mt-3 flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Presented by {event.business.name}</span>
                </Link>
              )}
            </div>

            <Separator />

            {/* About Section */}
            <div>
              <h2 className="mb-4 text-2xl font-bold">About</h2>

              {/* Event Date */}
              <div className="mb-6">
                <h3 className="mb-2 font-semibold">
                  {dayOfWeek}, {monthDay}
                </h3>
                <p className="text-muted-foreground">{event.title}</p>
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-6">
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Location Details */}
              <div className="space-y-2">
                {event.address && (
                  <p className="text-muted-foreground">{event.address}</p>
                )}
                <p className="text-muted-foreground">
                  {event.city}, {event.state}
                </p>
              </div>

              {/* Additional Info */}
              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="flex items-start gap-2">
                  <span className="text-sm">ℹ️</span>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-1 font-medium">
                      This is a {event.category} event
                    </p>
                    {event.createdBy && (
                      <p>
                        Organized by {event.createdBy.firstName}{" "}
                        {event.createdBy.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lineup / Attendees Section */}
            {attendees && attendees.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Who&apos;s Going</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {attendees
                    .filter((a) => a.status === "going")
                    .slice(0, 9)
                    .map((attendee) => (
                      <div
                        key={attendee.user.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={attendee.user.imageUrl || undefined}
                          />
                          <AvatarFallback>
                            {attendee.user.firstName?.[0]}
                            {attendee.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">
                            {attendee.user.firstName} {attendee.user.lastName}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {goingCount > 9 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    And {goingCount - 9} others are going
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Sticky RSVP Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardContent className="space-y-4 p-6">
                  {/* RSVP Status */}
                  <div>
                    <div
                      className={"flex flex-row items-center justify-between"}
                    >
                      <p className="text-base text-muted-foreground">
                        Your RSVP
                      </p>
                      {event.userRsvp?.status === "going" && (
                        <Badge
                          variant="default"
                          className="px-4 py-2 text-base"
                        >
                          You're going!
                        </Badge>
                      )}
                      {event.userRsvp?.status === "interested" && (
                        <Badge
                          variant="secondary"
                          className="px-4 py-2 text-base"
                        >
                          Interested
                        </Badge>
                      )}
                    </div>
                    {!event.userRsvp && (
                      <p className="text-sm text-muted-foreground">
                        RSVP to let others know you're attending
                      </p>
                    )}
                  </div>

                  {/* RSVP Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant={
                        event.userRsvp?.status === "going"
                          ? "default"
                          : "outline"
                      }
                      className="w-full"
                      size="lg"
                      onClick={() => handleRsvp("going")}
                      disabled={rsvpMutation.isPending}
                    >
                      {event.userRsvp?.status === "going"
                        ? "Going"
                        : "I'm Going"}
                    </Button>
                    <Button
                      variant={
                        event.userRsvp?.status === "interested"
                          ? "secondary"
                          : "outline"
                      }
                      className="w-full"
                      onClick={() => handleRsvp("interested")}
                      disabled={rsvpMutation.isPending}
                    >
                      Interested
                    </Button>
                  </div>

                  <Separator />

                  {/* Attendee Count */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Going
                      </span>
                      <span className="font-semibold">{goingCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Interested
                      </span>
                      <span className="font-semibold">{interestedCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
