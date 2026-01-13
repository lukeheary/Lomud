"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Building2,
  User,
  Clock,
  Loader2,
  CheckCircle2,
  Star,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";

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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Badge variant="outline" className="capitalize">
                    {event.category}
                  </Badge>
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  {event.business && (
                    <Link
                      href={`/business/${event.business.slug}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{event.business.name}</span>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {formatDateTime(new Date(event.startAt))}
                  </p>
                  {event.endAt && (
                    <p className="text-sm text-muted-foreground">
                      Until {formatDateTime(new Date(event.endAt))}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  {event.venueName && (
                    <p className="font-medium">{event.venueName}</p>
                  )}
                  {event.address && (
                    <p className="text-sm text-muted-foreground">{event.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {event.city}, {event.state}
                  </p>
                </div>
              </div>

              {/* Organizer */}
              {event.createdBy && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={event.createdBy.imageUrl || undefined} />
                      <AvatarFallback>
                        {event.createdBy.firstName?.[0]}
                        {event.createdBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      Organized by {event.createdBy.firstName}{" "}
                      {event.createdBy.lastName}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">About this event</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RSVP Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your RSVP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={event.userRsvp?.status === "going" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleRsvp("going")}
                disabled={rsvpMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Going
              </Button>
              <Button
                variant={
                  event.userRsvp?.status === "interested" ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => handleRsvp("interested")}
                disabled={rsvpMutation.isPending}
              >
                <Star className="h-4 w-4 mr-2" />
                Interested
              </Button>
              <Button
                variant={
                  event.userRsvp?.status === "not_going" ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => handleRsvp("not_going")}
                disabled={rsvpMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Not Going
              </Button>
            </CardContent>
          </Card>

          {/* Attendees Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Going</span>
                  <Badge variant="default">{goingCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Interested</span>
                  <Badge variant="secondary">{interestedCount}</Badge>
                </div>
              </div>

              {attendees && attendees.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {attendees
                      .filter((a) => a.status === "going")
                      .slice(0, 5)
                      .map((attendee) => (
                        <div
                          key={attendee.user.id}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={attendee.user.imageUrl || undefined}
                            />
                            <AvatarFallback>
                              {attendee.user.firstName?.[0]}
                              {attendee.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {attendee.user.firstName} {attendee.user.lastName}
                          </span>
                        </div>
                      ))}
                    {goingCount > 5 && (
                      <p className="text-xs text-muted-foreground">
                        And {goingCount - 5} more...
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
