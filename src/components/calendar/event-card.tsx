"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTime } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { type EventListItem } from "@/types/trpc";

interface EventCardProps {
  event: EventListItem;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.startAt);
  const dayOfWeek = format(eventDate, "EEE");
  const month = format(eventDate, "MMM");
  const day = format(eventDate, "d");
  const startTime = formatTime(event.startAt);

  const friendsGoing = event.friendsGoing || [];
  const displayedFriends = friendsGoing.slice(0, 5);
  const remainingCount = friendsGoing.length - displayedFriends.length;

  return (
    <Link href={`/event/${event.id}`} className="group">
      <Card className="h-full cursor-pointer overflow-hidden !border-none bg-card p-2 transition-all duration-300 md:flex-col">
        {/* Container - horizontal on mobile, vertical on desktop */}
        <div className="flex md:block">
          {/* Square Image - smaller on mobile, full width on desktop */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted md:aspect-square md:h-auto md:w-full lg:max-w-[274px]">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                <Calendar className="h-12 w-12 text-muted-foreground/20 md:h-24 md:w-24" />
              </div>
            )}

            {/* Friends Going - Bottom Right (shown on both mobile and desktop) */}
            {friendsGoing.length > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center gap-1 md:bottom-4 md:right-4">
                <div className="flex -space-x-2">
                  {displayedFriends.slice(0, 3).map((rsvp) => (
                    <Avatar
                      key={rsvp.user.id}
                      className="h-6 w-6 border border-background md:h-8 md:w-8"
                    >
                      <AvatarImage src={rsvp.user.imageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {rsvp.user.firstName?.[0]}
                        {rsvp.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {displayedFriends.slice(3, 5).map((rsvp) => (
                    <Avatar
                      key={rsvp.user.id}
                      className="hidden h-8 w-8 border border-background md:block"
                    >
                      <AvatarImage src={rsvp.user.imageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {rsvp.user.firstName?.[0]}
                        {rsvp.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {friendsGoing.length > 3 && (
                  <div className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-xs font-semibold md:hidden">
                    +{friendsGoing.length - 3}
                  </div>
                )}
                {remainingCount > 0 && (
                  <div className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold md:flex">
                    +{remainingCount}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event Information - to the right on mobile, below on desktop */}
          <div className="flex-1 space-y-0.5 py-1 pl-3 pr-1 md:px-3 md:py-3">
            {/* Title */}
            <h3 className="line-clamp-2 text-base font-bold leading-tight transition-colors group-hover:text-primary md:text-base">
              {event.title}
            </h3>

            {/* Date */}
            <div className="text-sm text-primary/70 md:text-sm">
              {dayOfWeek}, {month} {day} at {startTime}
            </div>

            {/* Venue & Organizer */}
            <div className="line-clamp-1 text-sm text-primary/70 md:text-sm">
              {event.venue && `${event.venue.name}`}
              {/*{event.organizer &&*/}
              {/*  (event.venue*/}
              {/*    ? ` • ${event.organizer.name}`*/}
              {/*    : event.organizer.name)}*/}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
