"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building2, Users } from "lucide-react";
import { EventFilterTab } from "@/types/events";
import { cn } from "@/lib/utils";

interface EventFilterTabsProps {
  value: EventFilterTab;
  onValueChange: (value: EventFilterTab) => void;
  className?: string;
  gridLayout?: boolean;
}

export function EventFilterTabs({
  value,
  onValueChange,
  className,
  gridLayout = false,
}: EventFilterTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onValueChange(val as EventFilterTab)}
      className={className}
    >
      <TabsList
        className={cn(gridLayout && "grid w-full max-w-md grid-cols-3")}
      >
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          All Events
        </TabsTrigger>
        <TabsTrigger value="followed" className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          Following
        </TabsTrigger>
        <TabsTrigger value="friends" className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          Friends Going
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
