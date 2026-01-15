"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  addDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  nextSunday,
  getDay,
} from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCardGrid } from "@/components/events/event-card-grid";
import {
  Loader2,
  Search,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn, formatTime } from "@/lib/utils";
import { EventFilterTabs } from "@/components/events/event-filter-tabs";
import { EventFilterTab } from "@/types/events";

type ViewMode = "week" | "month";

export default function HomePage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<EventFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current user to show their city
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  // Set default city to user's city on load
  useEffect(() => {
    if (currentUser?.city && selectedCity === "all") {
      setSelectedCity(currentUser.city);
    }
  }, [currentUser, selectedCity]);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const today = startOfDay(new Date());
      const start = currentDate < today ? today : startOfDay(currentDate);
      // If today is Sunday (0), end is today. Otherwise, get next Sunday
      const end = getDay(start) === 0 ? start : nextSunday(start);
      return { startDate: start, endDate: end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { startDate: start, endDate: end };
    }
  }, [viewMode, currentDate]);

  // Fetch events with current filters
  const {
    data: events,
    isLoading,
    error,
  } = trpc.event.listEventsByRange.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    followedOnly: activeFilter === "followed",
    friendsGoingOnly: activeFilter === "friends",
    city: selectedCity !== "all" ? selectedCity : undefined,
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

  // Filter events by search query (client-side)
  const filteredEventsByDay = useMemo(() => {
    if (!searchQuery.trim()) return eventsByDay;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof events> = {};

    Object.entries(eventsByDay).forEach(([dateKey, dayEvents]) => {
      const matchingEvents = dayEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.venueName?.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query)
      );

      if (matchingEvents.length > 0) {
        filtered[dateKey] = matchingEvents;
      }
    });

    return filtered;
  }, [eventsByDay, searchQuery]);

  const handlePrevious = () => {
    if (viewMode === "week") {
      const newDate = addDays(currentDate, -7);
      const today = startOfDay(new Date());
      setCurrentDate(newDate < today ? today : newDate);
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
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
      const today = startOfDay(new Date());
      const start = currentDate < today ? today : startOfDay(currentDate);
      const end = getDay(start) === 0 ? start : nextSunday(start);
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [viewMode, currentDate]);

  // Show error toast in useEffect to avoid rendering issues
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading events",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Header with Navigation */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Upcoming Events
            {selectedCity !== "all" && (
              <span className="text-muted-foreground"> in {selectedCity}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
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
          <div className="flex items-center rounded-md border">
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

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* City Filter */}
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full md:w-fit">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map((city) => (
              <SelectItem key={`${city.city}-${city.state}`} value={city.city}>
                {city.city}, {city.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Mode Toggle and Filter Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <EventFilterTabs
          value={activeFilter}
          onValueChange={setActiveFilter}
          className="flex-1"
        />

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
        <div className="space-y-8">
          {daysToDisplay.map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayEvents = filteredEventsByDay[dateKey] || [];
            const isToday = isSameDay(date, new Date());

            return (
              <div key={dateKey}>
                <div className="flex flex-col items-start">
                  <div className="min-w-[100px]">
                    <div
                      className={cn(
                        "mb-2 text-xl font-semibold",
                        isToday && "text-primary"
                      )}
                    >
                      {format(date, "EEEE, MMMM d")}
                    </div>
                  </div>
                  <div className="w-full flex-1">
                    {dayEvents.length === 0 ? (
                      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          No events scheduled
                        </p>
                      </div>
                    ) : (
                      <EventCardGrid
                        events={dayEvents}
                        columns={{ mobile: 2, desktop: 4 }}
                        gap="md"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {!isLoading && viewMode === "month" && (
        <Card>
          <CardContent className="p-4">
            {/* Day of week headers */}
            <div className="mb-2 grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {daysToDisplay.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const dayEvents = filteredEventsByDay[dateKey] || [];
                const isToday = isSameDay(date, new Date());
                const isCurrentMonth = isSameMonth(date, currentDate);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[120px] rounded-lg border p-2",
                      !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                      isToday && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 text-sm font-medium",
                        isToday && "text-primary"
                      )}
                    >
                      {format(date, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <HoverCard
                          key={event.id}
                          openDelay={200}
                          closeDelay={100}
                        >
                          <HoverCardTrigger asChild>
                            <div
                              className="cursor-pointer truncate rounded bg-primary/10 p-1 text-xs text-primary hover:bg-primary/20"
                              onClick={() =>
                                (window.location.href = `/event/${event.id}`)
                              }
                            >
                              {event.title}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-80"
                            side="right"
                            align="start"
                          >
                            <div className="space-y-3">
                              {/* Event Image */}
                              {event.imageUrl && (
                                <div className="relative h-32 w-full overflow-hidden rounded-md">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}

                              {/* Title */}
                              <div>
                                <h4 className="mb-1 text-base font-semibold leading-tight">
                                  {event.title}
                                </h4>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                                  {event.category}
                                </span>
                              </div>

                              {/* Date & Time */}
                              <div className="flex items-start gap-2 text-sm">
                                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {format(
                                      new Date(event.startAt),
                                      "EEEE, MMMM d"
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatTime(event.startAt)}
                                    {event.endAt &&
                                      ` - ${formatTime(event.endAt)}`}
                                  </div>
                                </div>
                              </div>

                              {/* Location */}
                              {(event.venueName || event.city) && (
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  <div>
                                    {event.venueName && (
                                      <div className="font-medium">
                                        {event.venueName}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground">
                                      {event.city}, {event.state}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Business */}
                              {event.venue && (
                                <div className="border-t pt-2 text-xs text-muted-foreground">
                                  Hosted by {event.venue.name}
                                </div>
                              )}

                              {/* Click to view */}
                              <div className="pt-1 text-center text-xs text-muted-foreground">
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
          <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No events found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery && "Try adjusting your search or filters"}
            {!searchQuery &&
              activeFilter === "followed" &&
              "Start following businesses to see their events here"}
            {!searchQuery &&
              activeFilter === "friends" &&
              "Add friends and see what events they're attending"}
            {!searchQuery &&
              activeFilter === "all" &&
              "Check back later for upcoming events"}
          </p>
        </div>
      )}
    </div>
  );
}
