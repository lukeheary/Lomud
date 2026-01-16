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
}: EventFilterTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onValueChange(val as EventFilterTab)}
      className={className}
    >
      <TabsList className={"w-full"}>
        <TabsTrigger
          value="all"
          className="flex flex-1 items-center gap-2 md:px-6"
        >
          {/*<Calendar className="hidden h-4 w-4 shrink-0 md:block" />*/}
          All Events
        </TabsTrigger>
        <TabsTrigger
          value="followed"
          className="flex flex-1 items-center gap-2 md:px-6"
        >
          {/*<Building2 className="hidden h-4 w-4 shrink-0 md:block" />*/}
          Following
        </TabsTrigger>
        <TabsTrigger
          value="friends"
          className="flex flex-1 items-center gap-2 md:px-6"
        >
          {/*<Users className="hidden h-4 w-4 shrink-0 md:block" />*/}
          Friends Going
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
