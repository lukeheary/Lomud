"use client";

import { useState, useMemo } from "react";
import {
  format,
  addDays,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/calendar/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Calendar as CalendarIcon,
  Users,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTime } from "@/lib/utils";

type FilterTab = "all" | "followed" | "friends";
type ViewMode = "week" | "month";

export default function CalendarPage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { startDate: start, endDate: end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { startDate: start, endDate: end };
    }
  }, [viewMode, currentDate]);

  // Fetch events with current filters
  const { data: events, isLoading } = trpc.event.listEventsByRange.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    followedOnly: activeFilter === "followed",
    friendsGoingOnly: activeFilter === "friends",
  });

  // Group events by day
  const eventsByDay = useMemo(() => {
    if (!events) return {};

    const grouped: Record<string, typeof events> = {};

    events.forEach((event) => {
      const dateKey = format(new Date(event.startAt), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [events]);

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days to display based on view mode
  const daysToDisplay = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    } else {
      // For month view, include days from previous/next month to fill the grid
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  }, [viewMode, currentDate]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            {viewMode === "week"
              ? format(dateRange.startDate, "MMMM d") +
                " - " +
                format(dateRange.endDate, "MMMM d, yyyy")
              : format(currentDate, "MMMM yyyy")}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as FilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
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

        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Week View */}
      {!isLoading && viewMode === "week" && (
        <div className="space-y-4">
          {daysToDisplay.map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayEvents = eventsByDay[dateKey] || [];
            const isToday = isSameDay(date, new Date());

            return (
              <Card key={dateKey} className={isToday ? "border-primary" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start flex-col">
                    <div className="min-w-[100px]">
                      <div
                        className={cn(
                          "text-lg font-semibold mb-2",
                          isToday && "text-primary"
                        )}
                      >
                        {format(date, "EEEE, MMMM d")}
                      </div>
                      {/*<div*/}
                      {/*  className={cn(*/}
                      {/*    "text-sm font-medium",*/}
                      {/*    isToday && "text-primary"*/}
                      {/*  )}*/}
                      {/*>*/}
                      {/*  {format(date, "EEEE")}*/}
                      {/*</div>*/}
                      {/*<div*/}
                      {/*  className={cn(*/}
                      {/*    "text-2xl font-bold",*/}
                      {/*    isToday && "text-primary"*/}
                      {/*  )}*/}
                      {/*>*/}
                      {/*  {format(date, "d")}*/}
                      {/*</div>*/}
                      {/*<div className="text-sm text-muted-foreground">*/}
                      {/*  {format(date, "MMM")}*/}
                      {/*</div>*/}
                    </div>
                    <div className="flex-1">
                      {dayEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No events scheduled
                        </p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2">
                          {dayEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {!isLoading && viewMode === "month" && (
        <Card>
          <CardContent className="p-4">
            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {daysToDisplay.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const dayEvents = eventsByDay[dateKey] || [];
                const isToday = isSameDay(date, new Date());
                const isCurrentMonth = isSameMonth(date, currentDate);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[120px] border rounded-lg p-2",
                      !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                      isToday && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "text-sm font-medium mb-1",
                        isToday && "text-primary"
                      )}
                    >
                      {format(date, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <HoverCard key={event.id} openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div
                              className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                              onClick={() =>
                                (window.location.href = `/event/${event.id}`)
                              }
                            >
                              {event.title}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80" side="right" align="start">
                            <div className="space-y-3">
                              {/* Event Image */}
                              {event.imageUrl && (
                                <div className="relative w-full h-32 rounded-md overflow-hidden">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {/* Title */}
                              <div>
                                <h4 className="font-semibold text-base leading-tight mb-1">
                                  {event.title}
                                </h4>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                                  {event.category}
                                </span>
                              </div>

                              {/* Date & Time */}
                              <div className="flex items-start gap-2 text-sm">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <div className="font-medium">
                                    {format(new Date(event.startAt), "EEEE, MMMM d")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatTime(event.startAt)}
                                    {event.endAt && ` - ${formatTime(event.endAt)}`}
                                  </div>
                                </div>
                              </div>

                              {/* Location */}
                              {(event.venueName || event.city) && (
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    {event.venueName && (
                                      <div className="font-medium">{event.venueName}</div>
                                    )}
                                    <div className="text-muted-foreground">
                                      {event.city}, {event.state}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Business */}
                              {event.business && (
                                <div className="pt-2 border-t text-xs text-muted-foreground">
                                  Hosted by {event.business.name}
                                </div>
                              )}

                              {/* Click to view */}
                              <div className="text-xs text-center text-muted-foreground pt-1">
                                Click to view full details
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && events && events.length === 0 && (
        <div className="py-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {activeFilter === "followed" &&
              "Start following businesses to see their events here"}
            {activeFilter === "friends" &&
              "Add friends and see what events they're attending"}
            {activeFilter === "all" && "No events scheduled for this period"}
          </p>
        </div>
      )}
    </div>
  );
}
