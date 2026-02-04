"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type VenueHours = {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DEFAULT_HOURS: DayHours = {
  open: "09:00",
  close: "17:00",
  closed: false,
};

interface VenueHoursEditorProps {
  hours: VenueHours | null;
  onChange: (hours: VenueHours) => void;
}

export function VenueHoursEditor({ hours, onChange }: VenueHoursEditorProps) {
  const getHoursForDay = (day: string): DayHours => {
    return hours?.[day as keyof VenueHours] || DEFAULT_HOURS;
  };

  const updateDay = (day: string, updates: Partial<DayHours>) => {
    const currentHours = getHoursForDay(day);
    onChange({
      ...hours,
      [day]: { ...currentHours, ...updates },
    });
  };

  return (
    <div className="w-full space-y-3">
      <Label className="text-base">Opening Hours</Label>
      <div className="w-full space-y-2">
        {DAYS.map((day) => {
          const dayHours = getHoursForDay(day);
          return (
            <div
              key={day}
              className="flex flex-col items-center gap-3 md:flex-row"
            >
              <div
                className={
                  "flex w-full flex-row justify-between md:w-64 md:justify-start md:gap-4"
                }
              >
                <Label className="text-sm capitalize md:w-24">{day}</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${day}-closed`}
                    checked={dayHours.closed}
                    onCheckedChange={(checked) =>
                      updateDay(day, { closed: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`${day}-closed`}
                    className="text-sm font-normal"
                  >
                    Closed
                  </Label>
                </div>
              </div>

              <div className={"flex flex-row gap-2"}>
                <Input
                  type="time"
                  value={dayHours.open}
                  onChange={(e) => updateDay(day, { open: e.target.value })}
                  disabled={dayHours.closed}
                  className="w-36 text-sm"
                />

                <span className="self-center text-sm">to</span>

                <Input
                  type="time"
                  value={dayHours.close}
                  onChange={(e) => updateDay(day, { close: e.target.value })}
                  disabled={dayHours.closed}
                  className="w-36 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
