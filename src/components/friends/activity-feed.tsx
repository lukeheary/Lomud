"use client";

import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Users,
  CheckCircle2,
  Star,
  Building2,
  CalendarPlus,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn, formatRelativeEventDate } from "@/lib/utils";

interface ActivityItemProps {
  activity: any;
  compact?: boolean;
}

function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  const { actor, type, entityType, entityId, metadata, createdAt, event } =
    activity;

  const eventRelativeDate = event?.startAt
    ? formatRelativeEventDate(new Date(event.startAt))
    : null;

  const renderIcon = () => {
    switch (type) {
      case "rsvp_going":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rsvp_interested":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "follow_venue":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "follow_organizer":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "created_event":
        return <CalendarPlus className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderContent = () => {
    const actorName = (
      <span className="font-medium text-foreground">
        {actor.firstName} {actor.lastName}
      </span>
    );

    const entityName =
      activity.event?.title ||
      activity.venue?.name ||
      activity.organizer?.name ||
      metadata?.name ||
      metadata?.title ||
      "an entity";

    switch (type) {
      case "rsvp_going":
        return (
          <>
            {actorName} is going to{" "}
            {compact ? (
              <>
                {/*<span className="md:hidden">*/}
                {/*  <Link*/}
                {/*    href={`/event/${entityId}`}*/}
                {/*    className="font-medium text-primary hover:underline"*/}
                {/*  >*/}
                {/*    {activity.event?.venueName || entityName}*/}
                {/*  </Link>*/}
                {/*</span>*/}
                {/*<span className="hidden md:inline">*/}
                <Link
                  href={`/event/${entityId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {entityName}
                </Link>
                {activity.event?.venueName && (
                  <>
                    {" "}
                    at{" "}
                    <Link
                      href={`/event/${entityId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {activity.event.venueName}
                    </Link>
                  </>
                )}
                {/*</span>*/}
              </>
            ) : (
              <Link
                href={`/event/${entityId}`}
                className="font-medium text-primary hover:underline"
              >
                {entityName}
              </Link>
            )}
          </>
        );
      case "rsvp_interested":
        return (
          <>
            {actorName} is interested in{" "}
            <Link
              href={`/event/${entityId}`}
              className="font-medium text-primary hover:underline"
            >
              {entityName}
            </Link>
          </>
        );
      case "follow_venue":
        return (
          <>
            {actorName} started following{" "}
            <span className="font-medium text-foreground">{entityName}</span>
          </>
        );
      case "follow_organizer":
        return (
          <>
            {actorName} started following{" "}
            <span className="font-medium text-foreground">{entityName}</span>
          </>
        );
      case "created_event":
        return (
          <>
            {actorName} created a new event:{" "}
            <Link
              href={`/event/${entityId}`}
              className="font-medium text-primary hover:underline"
            >
              {entityName}
            </Link>
          </>
        );
      default:
        return (
          <>
            {actorName} performed an action on {entityName}
          </>
        );
    }
  };

  const content = renderContent();

  return (
    <div
      className={
        compact ? "flex gap-3 pb-4 last:pb-0" : "flex gap-4 pb-2 last:pb-0"
      }
    >
      <div className="relative flex flex-col items-center pt-1.5">
        <Avatar
          className={
            compact
              ? "h-8 w-8"
              : "h-10 w-10 border-2 border-background ring-2 ring-muted/20"
          }
        >
          <AvatarImage src={actor.imageUrl || undefined} />
          <AvatarFallback>
            {actor.firstName?.[0]}
            {actor.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -right-1 -top-1 rounded-full bg-background p-0.5">
          {renderIcon()}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-base text-muted-foreground">
          {content}
          {eventRelativeDate && (
            <span className="ml-1.5 font-medium text-foreground/80">
              {eventRelativeDate}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({
  limit = 50,
  compact = false,
}: ActivityFeedProps) {
  const { data: activities, isLoading } = trpc.friends.getFriendFeed.useQuery({
    limit,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "rounded-2xl border border-dashed py-6" : "py-16"
        )}
      >
        <div
          className={cn(
            "rounded-full bg-muted/30",
            compact ? "mb-2 p-2" : "mb-4 p-4"
          )}
        >
          <Users
            className={cn(
              "text-muted-foreground/60",
              compact ? "h-5 w-5" : "h-8 w-8"
            )}
          />
        </div>
        <p className={cn("font-medium", compact ? "text-sm" : "text-lg")}>
          No recent activity
        </p>
        {/*<p*/}
        {/*  className={cn(*/}
        {/*    "text-muted-foreground",*/}
        {/*    compact ? "text-xs" : "text-sm",*/}
        {/*    !compact && "max-w-[250px]"*/}
        {/*  )}*/}
        {/*>*/}
        {/*  When your friends RSVP to events or follow venues, you'll see it here.*/}
        {/*</p>*/}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        {activities.map((activity: any, index: number) => (
          <div key={activity.id} className="relative pb-3 last:pb-0">
            <ActivityItem activity={activity} compact={compact} />
            {!compact && index !== activities.length - 1 && (
              <div className="absolute left-[19px] top-10 h-full w-px bg-muted" />
            )}
          </div>
        ))}
      </div>

      {/*{compact && activities.length >= limit && (*/}
      {/*  <div className="flex justify-center pt-2">*/}
      {/*    <Button*/}
      {/*      variant="ghost"*/}
      {/*      size="sm"*/}
      {/*      asChild*/}
      {/*      className="text-muted-foreground hover:text-primary"*/}
      {/*    >*/}
      {/*      <Link href="/friends">Show more activity</Link>*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
}
