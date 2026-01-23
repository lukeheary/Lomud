"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
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
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  startOfISOWeek,
  endOfISOWeek,
  isSameWeek,
} from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCardGrid } from "@/components/events/event-card-grid";
import {
  Loader2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SearchInput } from "@/components/ui/search-input";
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
import { EventFilterSelect } from "@/components/events/event-filter-select";
import { EventFilterTab } from "@/types/events";
import { useQueryState, parseAsString, parseAsIsoDate } from "nuqs";
import { parseISO, subDays } from "date-fns";
import { ActivityFeed } from "@/components/friends/activity-feed";

type ViewMode = "week" | "month";

function HomePageContent() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<EventFilterTab>("all");
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    scroll: false,
    shallow: true,
  });
  const [selectedCity, setSelectedCity] = useQueryState("city", {
    defaultValue: "all",
    scroll: false,
    shallow: true,
  });
  const [viewMode, setViewMode] = useQueryState<ViewMode>("view", {
    defaultValue: "week",
    parse: (value) => (value === "month" ? "month" : "week"),
    serialize: (value) => value,
    scroll: false,
    shallow: true,
  });
  const [dateParam, setDateParam] = useQueryState("date", {
    defaultValue: format(new Date(), "yyyy-MM-dd"),
    scroll: false,
    shallow: true,
  });
  const [hasSetInitialCity, setHasSetInitialCity] = useState(false);

  const currentDate = useMemo(() => {
    try {
      return startOfDay(parseISO(dateParam));
    } catch (e) {
      return startOfDay(new Date());
    }
  }, [dateParam]);

  const isCurrentWeek = useMemo(() => {
    if (viewMode !== "week") return false;
    const today = startOfDay(new Date());
    return (
      isSameWeek(currentDate, today, { weekStartsOn: 1 }) ||
      isBefore(currentDate, today)
    );
  }, [viewMode, currentDate]);

  // Get current user to show their city
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  // Set default city to user's city on initial load only
  useEffect(() => {
    if (currentUser?.city && selectedCity === "all" && !hasSetInitialCity) {
      void setSelectedCity(currentUser.city, { scroll: false, shallow: true });
      setHasSetInitialCity(true);
    }
  }, [currentUser, selectedCity, hasSetInitialCity, setSelectedCity]);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    if (viewMode === "week") {
      if (isCurrentWeek) {
        // Current week: start from today and go to Sunday
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return { startDate: today, endDate: end };
      } else {
        // Any other week: show full week from Monday to Sunday
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(start, { weekStartsOn: 1 });
        return { startDate: start, endDate: end };
      }
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { startDate: start, endDate: end };
    }
  }, [viewMode, currentDate, isCurrentWeek]);

  // Fetch events with current filters
  const {
    data: events,
    isLoading,
    isFetching,
    error,
  } = trpc.event.listEventsByRange.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      followedOnly: activeFilter === "followed",
      friendsGoingOnly: activeFilter === "friends",
      city: selectedCity !== "all" ? selectedCity : undefined,
      search: searchQuery || undefined,
    },
    {
      placeholderData: (previousData) => previousData,
    }
  );

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

  const handlePrevious = async () => {
    if (viewMode === "week") {
      const today = startOfDay(new Date());
      if (isCurrentWeek) return;

      const prevWeekStart = addDays(currentDate, -7);
      // If going back takes us into the current week (or before it), jump to today
      if (
        isSameWeek(prevWeekStart, today, { weekStartsOn: 1 }) ||
        isBefore(prevWeekStart, today)
      ) {
        await setDateParam(format(today, "yyyy-MM-dd"), {
          scroll: false,
          shallow: true,
        });
      } else {
        await setDateParam(
          format(startOfWeek(prevWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          { scroll: false, shallow: true }
        );
      }
    } else {
      await setDateParam(format(subMonths(currentDate, 1), "yyyy-MM-dd"), {
        scroll: false,
        shallow: true,
      });
    }
  };

  const handleNext = async () => {
    if (viewMode === "week") {
      const today = startOfDay(new Date());
      let nextDate: Date;

      if (isCurrentWeek) {
        // From current week, go to next Monday
        nextDate = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
      } else {
        // From any other week, go to next Monday
        nextDate = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 7);
      }
      await setDateParam(format(nextDate, "yyyy-MM-dd"), {
        scroll: false,
        shallow: true,
      });
    } else {
      await setDateParam(format(addMonths(currentDate, 1), "yyyy-MM-dd"), {
        scroll: false,
        shallow: true,
      });
    }
  };

  const handleToday = async () => {
    await setDateParam(format(new Date(), "yyyy-MM-dd"), {
      scroll: false,
      shallow: true,
    });
  };

  // Get days to display based on view mode
  const daysToDisplay = useMemo(() => {
    if (viewMode === "week") {
      return eachDayOfInterval({
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [viewMode, currentDate, dateRange]);

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
    <div className="container relative mx-auto min-h-screen space-y-4 py-4 md:py-8">
      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className={"flex w-full flex-row gap-2"}>
          <Suspense fallback={null}>
            <SearchInput
              placeholder="Search events..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </Suspense>
          <div className="flex h-12 items-center overflow-hidden rounded-full border border-input bg-background shadow-sm md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-14 rounded-none border-r bg-muted px-0"
              onClick={handlePrevious}
              disabled={isCurrentWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-14 rounded-none bg-muted px-0 focus:bg-muted/80"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex w-full gap-2 sm:w-fit">
          {/* City Filter */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="flex-1 shrink-0 sm:w-[200px]">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities?.map((city) => (
                <SelectItem
                  key={`${city.city}-${city.state}`}
                  value={city.city}
                >
                  {city.city}, {city.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <EventFilterSelect
            value={activeFilter}
            onValueChange={setActiveFilter}
            className="w-[160px] shrink-0"
          />

          {/* Navigation Controls */}
          <div className="hidden h-12 items-center overflow-hidden rounded-full border border-input bg-background shadow-sm md:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-9 rounded-none border-r bg-muted px-0"
              onClick={handlePrevious}
              disabled={isCurrentWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-9 rounded-none bg-muted px-0"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Friend Activity Feed */}
      <div className="mb-4">
        <Link href="/friends" className="transition-colors hover:text-primary">
          <div className="flex items-center gap-1 pb-2">
            <h1 className="text-xl font-bold tracking-tight md:text-3xl">
              Recent Activity
            </h1>
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <ActivityFeed limit={3} compact={true} />
      </div>

      {/* add a divider line*/}
      <hr className="my-4 border-t" />

      {/*  <Tabs*/}
      {/*    value={viewMode}*/}
      {/*    onValueChange={(value) => setViewMode(value as ViewMode)}*/}
      {/*  >*/}
      {/*    <TabsList>*/}
      {/*      <TabsTrigger value="week">Week</TabsTrigger>*/}
      {/*      <TabsTrigger value="month">Month</TabsTrigger>*/}
      {/*    </TabsList>*/}
      {/*  </Tabs>*/}
      {/*</div>*/}

      {/* Loading Indicator */}
      {/*{isFetching && (*/}
      {/*  <div className="absolute right-0 top-0 flex items-center gap-2 p-4 md:relative md:p-0 md:pt-4">*/}
      {/*    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />*/}
      {/*    <span className="text-sm text-muted-foreground">Updating events...</span>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* Initial Loading State */}
      {isLoading && !events && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && events && (
        <div className="space-y-6">
          {daysToDisplay.map((date, index) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayEvents = eventsByDay[dateKey] || [];
            const isToday = isSameDay(date, new Date());

            return (
              <div key={dateKey}>
                <div className="flex flex-col items-start">
                  <div className="mb-2 flex w-full min-w-[100px] flex-row items-center justify-between">
                    <div
                      className={cn(
                        "text-xl font-semibold",
                        isToday && "text-primary"
                      )}
                    >
                      {format(date, "EEEE, MMMM d")}
                    </div>

                    {index === 0 && (
                      <div className="flex items-center gap-2">
                        {/* hide today button if you're viewing a different week*/}
                        {/*<Button*/}
                        {/*  variant="outline"*/}
                        {/*  size="sm"*/}
                        {/*  onClick={handleToday}*/}
                        {/*>*/}
                        {/*  Today*/}
                        {/*</Button>*/}

                        {/*<div className="flex items-center rounded-md border">*/}
                        {/*  <Button*/}
                        {/*    variant="ghost"*/}
                        {/*    size="icon"*/}
                        {/*    className="h-8 w-8"*/}
                        {/*    onClick={handlePrevious}*/}
                        {/*  >*/}
                        {/*    <ChevronLeft className="h-4 w-4" />*/}
                        {/*  </Button>*/}
                        {/*  <Button*/}
                        {/*    variant="ghost"*/}
                        {/*    size="icon"*/}
                        {/*    className="h-8 w-8"*/}
                        {/*    onClick={handleNext}*/}
                        {/*  >*/}
                        {/*    <ChevronRight className="h-4 w-4" />*/}
                        {/*  </Button>*/}
                        {/*</div>*/}
                      </div>
                    )}
                  </div>

                  <div className="w-full flex-1">
                    {dayEvents.length === 0 ? (
                      <div className="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed md:min-h-[300px]">
                        <p className="text-sm text-muted-foreground">
                          No events scheduled
                        </p>
                      </div>
                    ) : (
                      <EventCardGrid
                        events={dayEvents}
                        columns={{ mobile: 1, tablet: 3, desktop: 4 }}
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
      {viewMode === "month" && events && (
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
                const dayEvents = eventsByDay[dateKey] || [];
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
                                  <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto min-h-screen py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
