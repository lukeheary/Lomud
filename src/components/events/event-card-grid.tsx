"use client";

import { EventCard } from "@/components/calendar/event-card";
import { cn } from "@/lib/utils";
import { type EventListItem } from "@/types/trpc";

interface EventCardGridProps {
  events: EventListItem[];
  columns?: {
    mobile: number;
    tablet?: number;
    desktop: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function EventCardGrid({
  events,
  columns = { mobile: 2, desktop: 4 },
  gap = "md",
  className,
}: EventCardGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-4 lg:gap-6",
  };

  const getGridColsClass = () => {
    const mobileClass = `grid-cols-${columns.mobile}`;
    const tabletClass = columns.tablet ? `md:grid-cols-${columns.tablet}` : "";
    const desktopClass = `lg:grid-cols-${columns.desktop}`;

    return cn(mobileClass, tabletClass, desktopClass);
  };

  return (
    <div className={cn("grid", getGridColsClass(), gapClasses[gap], className)}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
