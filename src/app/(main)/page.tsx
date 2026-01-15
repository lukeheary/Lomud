"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/calendar/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterTab = "all" | "followed" | "friends";

export default function HomePage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Calculate 7-day range starting from today
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    const endDate = addDays(today, 7);
    return { startDate: today, endDate };
  }, []);

  // Fetch events with current filters
  const { data: events, isLoading, error } = trpc.event.listEventsByRange.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    followedOnly: activeFilter === "followed",
    friendsGoingOnly: activeFilter === "friends",
  });

  // Group events by day
  const eventsByDay = useMemo(() => {
    if (!events) return {};

    const grouped: Record<string, typeof events> = {};

    for (let i = 0; i < 7; i++) {
      const date = addDays(dateRange.startDate, i);
      const dateKey = format(date, "yyyy-MM-dd");
      grouped[dateKey] = [];
    }

    events.forEach((event) => {
      const dateKey = format(new Date(event.startAt), "yyyy-MM-dd");
      if (grouped[dateKey]) {
        grouped[dateKey].push(event);
      }
    });

    return grouped;
  }, [events, dateRange.startDate]);

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
          <h1 className="text-3xl font-bold tracking-tight">Your Calendar</h1>
          <p className="text-muted-foreground">
            Discover local events happening this week
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

      {/* 7-Day Calendar Grid */}
      {!isLoading && events && (
        <div className="space-y-6">
          {Object.entries(eventsByDay).map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey);
            const isToday =
              format(new Date(), "yyyy-MM-dd") === dateKey;

            return (
              <Card key={dateKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      {format(date, "EEEE, MMMM d")}
                      {isToday && (
                        <span className="ml-2 text-sm font-normal text-primary">
                          (Today)
                        </span>
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No events scheduled for this day
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dayEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
