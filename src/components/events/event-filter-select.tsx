"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventFilterTab } from "@/types/events";

interface EventFilterSelectProps {
  value: EventFilterTab;
  onValueChange: (value: EventFilterTab) => void;
  className?: string;
}

export function EventFilterSelect({
  value,
  onValueChange,
  className,
}: EventFilterSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as EventFilterTab)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Filter events" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Events</SelectItem>
        <SelectItem value="followed">Following</SelectItem>
        <SelectItem value="friends">Friends Going</SelectItem>
      </SelectContent>
    </Select>
  );
}
