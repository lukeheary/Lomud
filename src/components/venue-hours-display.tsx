"use client";

import { Clock, ChevronRight } from "lucide-react";
import type { VenueHours } from "@/components/venue-hours-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

interface VenueHoursDisplayProps {
  hours: VenueHours | null;
}

export function VenueHoursDisplay({ hours }: VenueHoursDisplayProps) {
  if (!hours) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get today's hours for the preview
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const todayHours = hours[today as keyof VenueHours];
  const todayLabel = todayHours?.closed
    ? "Closed today"
    : todayHours
      ? `Open today ${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`
      : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-left transition-colors"
        >
          <Clock className="h-4 w-4 flex-shrink-0" />
          {todayLabel && (
            <span className="text-muted-foreground">{todayLabel}</span>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hours</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const dayHours = hours[key as keyof VenueHours];
            if (!dayHours) return null;

            const isToday = key === today;

            return (
              <div
                key={key}
                className={`flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 ${
                  isToday ? "font-medium" : ""
                }`}
              >
                <span
                  className={
                    isToday ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {label}
                  {isToday && " (Today)"}
                </span>
                {dayHours.closed ? (
                  <span className="text-muted-foreground">Closed</span>
                ) : (
                  <span>
                    {formatTime(dayHours.open)} - {formatTime(dayHours.close)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
