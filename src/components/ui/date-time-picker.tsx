"use client";

import * as React from "react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: string; // datetime-local format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the datetime-local string to a Date object
  const selectedDate = value ? new Date(value) : undefined;

  // Get hours and minutes from the selected date
  const hours = selectedDate ? selectedDate.getHours() : 19; // Default to 7 PM
  const minutes = selectedDate ? selectedDate.getMinutes() : 0;

  // Convert to 12-hour format for display
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  // Format the display value
  const displayValue = selectedDate
    ? format(selectedDate, "EEE, MMM d, yyyy 'at' h:mm a")
    : placeholder;

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Preserve the existing time or use default
    const newDate = setMinutes(setHours(date, hours), minutes);
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  // Handle hour change
  const handleHourChange = (hourStr: string) => {
    const baseDate = selectedDate || new Date();

    const hour12 = parseInt(hourStr);
    let hour24 = hour12;
    if (ampm === "PM" && hour12 !== 12) hour24 = hour12 + 12;
    if (ampm === "AM" && hour12 === 12) hour24 = 0;

    const newDate = setMinutes(setHours(baseDate, hour24), minutes);
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  // Handle minute change
  const handleMinuteChange = (minuteStr: string) => {
    const baseDate = selectedDate || new Date();

    const newDate = setMinutes(setHours(baseDate, hours), parseInt(minuteStr));
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  // Handle AM/PM change
  const handleAmPmChange = (newAmPm: string) => {
    const baseDate = selectedDate || new Date();

    let newHour = hours12;
    if (newAmPm === "PM" && hours12 !== 12) newHour = hours12 + 12;
    if (newAmPm === "AM" && hours12 === 12) newHour = 0;
    if (newAmPm === "AM" && hours12 !== 12) newHour = hours12;
    if (newAmPm === "PM" && hours12 === 12) newHour = 12;

    const newDate = setMinutes(setHours(baseDate, newHour), minutes);
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minute options (0, 15, 30, 45) for quick selection
  const minuteOptions = [0, 15, 30, 45];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-12 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-2xl p-0"
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t px-6 py-4">
          <div className="flex items-center gap-2">
            <Select value={hours12.toString()} onValueChange={handleHourChange}>
              <SelectTrigger className="w-[84px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground">:</span>

            <Select
              value={minutes.toString()}
              onValueChange={handleMinuteChange}
            >
              <SelectTrigger className="w-[84px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((minute) => (
                  <SelectItem key={minute} value={minute.toString()}>
                    {minute.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ampm} onValueChange={handleAmPmChange}>
              <SelectTrigger className="w-[84px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
