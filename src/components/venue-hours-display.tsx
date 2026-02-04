"use client";

import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import type { VenueHours } from "@/components/venue-hours-editor";

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
  defaultOpen?: boolean;
}

export function VenueHoursDisplay({
  hours,
  defaultOpen = false,
}: VenueHoursDisplayProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    <div className="w-full space-y-2 md:max-w-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md text-left font-medium transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Hours</span>
          {todayLabel && !isOpen && (
            <span className="font-normal text-muted-foreground">
              · {todayLabel}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="space-y-1.5 pl-6">
          {DAYS.map(({ key, label }) => {
            const dayHours = hours[key as keyof VenueHours];
            if (!dayHours) return null;

            const isToday = key === today;

            return (
              <div
                key={key}
                className={`flex items-center justify-between border-b pb-1.5 last:border-0 last:pb-0 ${
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
      )}
    </div>
  );
}
