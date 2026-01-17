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
  Edit,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { useState } from "react";

type RsvpStatus = "going" | "interested" | "not_going";

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Fetch event data
  const { data: event, isLoading } = trpc.event.getEventById.useQuery({
    eventId,
  });

  // Fetch attendees
  const { data: attendees } = trpc.event.listEventAttendees.useQuery({
    eventId,
  });

  // Check if user is admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  // Get current user
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

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

  const deleteRsvpMutation = trpc.event.deleteRsvp.useMutation({
    onSuccess: () => {
      toast({
        title: "RSVP Removed",
        description: "Your RSVP has been removed",
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
    // If clicking the same status button again, remove the RSVP
    if (event?.userRsvp?.status === status) {
      deleteRsvpMutation.mutate({ eventId });
    } else {
      rsvpMutation.mutate({ eventId, status });
    }
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
        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Event not found</h2>
        <p className="mb-4 text-muted-foreground">
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

  // Get users who are going for avatar stack
  const goingUsers =
    attendees?.filter((a) => a.status === "going").map((a) => a.user) || [];

  const eventDate = new Date(event.startAt);
  const dayOfWeek = format(eventDate, "EEEE");
  const monthDay = format(eventDate, "MMMM d, yyyy");
  const time = format(eventDate, "h:mm a zzz");

  // Check if user can edit this event
  const canEdit =
    isAdmin || (currentUser && event.createdByUserId === currentUser.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Image Modal */}
      {isImageModalOpen && event.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 h-10 w-10 text-white hover:bg-white/20"
            onClick={() => setIsImageModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              width={1200}
              height={800}
              className="h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* Mobile Image - Full Width at Top */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted lg:hidden">
        {event.imageUrl ? (
          <div
            className="relative h-full w-full cursor-pointer"
            onClick={() => setIsImageModalOpen(true)}
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Calendar className="h-24 w-24 text-muted-foreground/40" />
          </div>
        )}

        {/* Action Icons - Top Right on Mobile */}
        <div className="absolute right-4 top-4 flex gap-2">
          {canEdit && (
            <Link href={`/event/${eventId}/edit`}>
              <Button size="icon" variant="secondary" className="h-10 w-10">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button size="icon" variant="secondary" className="h-10 w-10">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-10 w-10">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Avatars - Bottom Right on Mobile */}
        {goingUsers.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <AvatarStack users={goingUsers} maxDisplay={5} size="md" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Title & Basic Info */}
            <div className={"pb-4"}>
              <div className="mb-2 flex items-start justify-between">
                <h1 className="text-4xl font-bold">{event.title}</h1>
                {/* Desktop Action Icons */}
                <div className="hidden gap-2 lg:flex">
                  {canEdit && (
                    <Link href={`/event/${eventId}/edit`}>
                      <Button size="icon" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {event.venueName && (
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{event.venueName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {dayOfWeek}, {monthDay}, {time}
                </span>
              </div>

              {event.organizer && (
                <Link
                  href={`/organizer/${event.organizer.slug}`}
                  className="mt-1 flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Users className="h-4 w-4" />
                  <span>Hosted by {event.organizer.name}</span>
                </Link>
              )}
            </div>

            {/* Mobile RSVP Buttons */}
            <div className="flex gap-2 pb-4 lg:hidden">
              <Button
                variant={
                  event.userRsvp?.status === "interested"
                    ? "secondary"
                    : "outline"
                }
                className="flex-1 text-base font-medium"
                size="lg"
                onClick={() => handleRsvp("interested")}
                disabled={
                  rsvpMutation.isPending || deleteRsvpMutation.isPending
                }
              >
                Interested
              </Button>
              <Button
                variant={"outline"}
                className={cn("flex-1 text-base font-medium", {
                  "bg-green-500 text-black": event.userRsvp?.status === "going",
                })}
                size="lg"
                onClick={() => handleRsvp("going")}
                disabled={
                  rsvpMutation.isPending || deleteRsvpMutation.isPending
                }
              >
                {event.userRsvp?.status === "going" ? "Going" : "I'm Going"}
              </Button>
            </div>

            <Separator />

            {/* About Section */}
            <div className={"pt-4"}>
              <h2 className="mb-2 text-2xl font-bold">About</h2>

              {/* Event Date */}
              <div className="mb-6">
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
              <div className={"pt-4"}>
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

          {/* Sidebar - Sticky Card with Image and RSVP (Desktop Only) */}
          <div className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-4">
              <Card className="overflow-hidden">
                {/* Event Image - Square on Top */}
                <div className="relative w-full overflow-hidden bg-muted">
                  {event.imageUrl ? (
                    <div
                      className="relative w-full cursor-pointer transition-all hover:brightness-75"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        width={500}
                        height={500}
                        className="h-auto w-full object-contain"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Calendar className="h-24 w-24 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Card Content Below Image */}
                <CardContent className="p-6">
                  {/* RSVP Buttons */}
                  <div className="flex gap-2 pb-4">
                    <Button
                      variant={
                        event.userRsvp?.status === "interested"
                          ? "secondary"
                          : "outline"
                      }
                      className="flex-1 text-base font-medium"
                      size="lg"
                      onClick={() => handleRsvp("interested")}
                      disabled={
                        rsvpMutation.isPending || deleteRsvpMutation.isPending
                      }
                    >
                      Interested
                    </Button>
                    <Button
                      variant={"outline"}
                      className={cn("flex-1 text-base font-medium", {
                        "bg-green-500 text-black":
                          event.userRsvp?.status === "going",
                      })}
                      size="lg"
                      onClick={() => handleRsvp("going")}
                      disabled={
                        rsvpMutation.isPending || deleteRsvpMutation.isPending
                      }
                    >
                      {event.userRsvp?.status === "going"
                        ? "Going"
                        : "I'm Going"}
                    </Button>
                  </div>

                  <Separator />

                  {/* Attendee Count */}
                  <div className="space-y-2 pt-4">
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
