"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FollowFilterSelectProps {
  value: "all" | "followed";
  onValueChange: (value: "all" | "followed") => void;
  allLabel: string;
  className?: string;
}

export function FollowFilterSelect({
  value,
  onValueChange,
  allLabel,
  className,
}: FollowFilterSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as "all" | "followed")}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        <SelectItem value="followed">Following</SelectItem>
      </SelectContent>
    </Select>
  );
}
