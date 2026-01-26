import { Clock } from "lucide-react";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Hours
      </div>
      <div className="space-y-1.5 text-sm">
        {DAYS.map(({ key, label }) => {
          const dayHours = hours[key as keyof VenueHours];
          if (!dayHours) return null;

          return (
            <div
              key={key}
              className="flex items-center justify-between border-b pb-1.5"
            >
              <span className="font-medium text-muted-foreground">{label}</span>
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
    </div>
  );
}
