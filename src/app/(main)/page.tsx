"use client";

import { useState, useMemo } from "react";
import { addDays, startOfDay } from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/calendar/event-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterTab = "all" | "followed" | "friends";

export default function HomePage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Calculate date range for upcoming events (next 30 days)
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    const endDate = addDays(today, 30);
    return { startDate: today, endDate };
  }, []);

  // Fetch events with current filters
  const { data: events, isLoading, error } = trpc.event.listEventsByRange.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    followedOnly: activeFilter === "followed",
    friendsGoingOnly: activeFilter === "friends",
  });

  if (error) {
    toast({
      title: "Error loading events",
      description: error.message,
      variant: "destructive",
    });
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground">
            Discover local events happening in your area
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(value) => setActiveFilter(value as FilterTab)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All Events
          </TabsTrigger>
          <TabsTrigger value="followed" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends Going
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Event List */}
      {!isLoading && events && events.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events && events.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {activeFilter === "followed" &&
              "Start following businesses to see their events here"}
            {activeFilter === "friends" &&
              "Add friends and see what events they're attending"}
            {activeFilter === "all" &&
              "Check back later for upcoming events"}
          </p>
        </div>
      )}
    </div>
  );
}
