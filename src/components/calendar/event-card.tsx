"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { Calendar, MapPin, Building2 } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date | null;
    venueName: string | null;
    city: string;
    state: string;
    category: string;
    business: {
      name: string;
      slug: string;
    } | null;
    userRsvp: {
      status: string;
    } | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const getRsvpBadgeVariant = (status: string | null) => {
    if (!status) return "outline";
    switch (status) {
      case "going":
        return "default";
      case "interested":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Link href={`/event/${event.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-none tracking-tight">
                {event.title}
              </h3>
              {event.business && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {event.business.name}
                </p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {event.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatTime(new Date(event.startAt))}
              {event.endAt && ` - ${formatTime(new Date(event.endAt))}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {event.venueName ? `${event.venueName} • ` : ""}{event.city}, {event.state}
            </span>
          </div>
          {event.userRsvp && (
            <Badge variant={getRsvpBadgeVariant(event.userRsvp.status)}>
              {event.userRsvp.status === "going" && "Going"}
              {event.userRsvp.status === "interested" && "Interested"}
              {event.userRsvp.status === "not_going" && "Not Going"}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
