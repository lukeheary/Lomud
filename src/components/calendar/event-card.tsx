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
      <Card className="cursor-pointer overflow-hidden !border-none bg-card transition-all duration-300 p-2 h-full">
        {/* Square Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted lg:max-w-[274px]">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
              <Calendar className="h-24 w-24 text-muted-foreground/20" />
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="capitalize">
              {event.category}
            </Badge>
          </div>

          {/* Friends Going - Bottom Right */}
          {friendsGoing.length > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              <div className="flex -space-x-2">
                {displayedFriends.map((rsvp) => (
                  <Avatar
                    key={rsvp.user.id}
                    className="h-8 w-8 border border-background"
                  >
                    <AvatarImage src={rsvp.user.imageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {rsvp.user.firstName?.[0]}
                      {rsvp.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {remainingCount > 0 && (
                <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                  +{remainingCount}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event Information */}
        <div className="space-y-0.5 px-3 py-3">
          {/* Title */}
          <h3 className="line-clamp-2 text-base font-bold leading-tight transition-colors group-hover:text-primary">
            {event.title}
          </h3>

          {/* Date & Venue */}
          <div className="text-sm text-primary/70">
            {dayOfWeek}, {month} {day} at {startTime}
          </div>

          <div className="text-sm text-primary/70">
            {event.business && `${event.business.name}`}
          </div>

          {/* Location */}
          {/*<div className="flex flex-row gap-1 text-sm text-muted-foreground">*/}
          {/*  {event.business && (*/}
          {/*    <div className="text-muted-foreground">{event.business.name}</div>*/}
          {/*  )}*/}
          {/*  {event.business && <span>•</span>}*/}
          {/*  {event.city}, {event.state}*/}
          {/*</div>*/}

          {/* Business */}
        </div>
      </Card>
    </Link>
  );
}
