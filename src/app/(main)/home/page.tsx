"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays, startOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/calendar/event-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Building2, Loader2, Search, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "followed" | "friends";
type DateRange = "all" | "today" | "week" | "custom";

export default function HomePage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [dateRangeType, setDateRangeType] = useState<DateRange>("all");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

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

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());

    if (dateRangeType === "today") {
      return { startDate: today, endDate: addDays(today, 1) };
    } else if (dateRangeType === "week") {
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
      return { startDate: weekStart, endDate: weekEnd };
    } else if (dateRangeType === "custom" && customDate) {
      const customStart = startOfDay(customDate);
      return { startDate: customStart, endDate: addDays(customStart, 1) };
    } else {
      // Default: next 30 days
      return { startDate: today, endDate: addDays(today, 30) };
    }
  }, [dateRangeType, customDate]);

  // Fetch events with current filters
  const { data: events, isLoading, error } = trpc.event.listEventsByRange.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    followedOnly: activeFilter === "followed",
    friendsGoingOnly: activeFilter === "friends",
    city: selectedCity !== "all" ? selectedCity : undefined,
  });

  // Filter events by search query (client-side)
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.venueName?.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Upcoming Events
            {currentUser?.city && selectedCity === currentUser.city && (
              <span className="text-muted-foreground"> in {currentUser.city}</span>
            )}
          </h1>
          {/*<p className="text-muted-foreground">*/}
          {/*  Discover local events happening in your area*/}
          {/*</p>*/}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          <SelectTrigger className="w-full sm:w-[200px]">
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

        {/* Date Range Filter */}
        <div className="flex gap-2">
          <Select value={dateRangeType} onValueChange={(value) => setDateRangeType(value as DateRange)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Next 30 Days</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Picker */}
          {dateRangeType === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !customDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate ? format(customDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
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
      {!isLoading && filteredEvents && filteredEvents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEvents && filteredEvents.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery && "Try adjusting your search or filters"}
            {!searchQuery && activeFilter === "followed" &&
              "Start following businesses to see their events here"}
            {!searchQuery && activeFilter === "friends" &&
              "Add friends and see what events they're attending"}
            {!searchQuery && activeFilter === "all" &&
              "Check back later for upcoming events"}
          </p>
        </div>
      )}
    </div>
  );
}
