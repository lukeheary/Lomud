"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import { addDays, startOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/calendar/event-card";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Building2,
  MapPin,
  Globe,
  Instagram,
  Heart,
  Plus,
  Loader2,
  Search,
  CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

type DateRange = "all" | "today" | "week" | "custom";

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeType, setDateRangeType] = useState<DateRange>("all");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  // Fetch business data
  const { data: business, isLoading } = trpc.business.getBusinessBySlug.useQuery(
    { slug }
  );

  // Check if admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  // Check if following
  const { data: isFollowing } = trpc.business.isFollowing.useQuery(
    { businessId: business?.id || "" },
    { enabled: !!business?.id }
  );

  // Follow mutation
  const followMutation = trpc.business.followBusiness.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this business",
      });
      utils.business.isFollowing.invalidate();
      utils.business.getBusinessBySlug.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = trpc.business.unfollowBusiness.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You unfollowed this business",
      });
      utils.business.isFollowing.invalidate();
      utils.business.getBusinessBySlug.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = () => {
    if (!business) return;

    if (isFollowing) {
      unfollowMutation.mutate({ businessId: business.id });
    } else {
      followMutation.mutate({ businessId: business.id });
    }
  };

  // Calculate date range for filtering
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

  // Filter events by search query and date range (client-side)
  const filteredEvents = useMemo(() => {
    if (!(business as any)?.events) return [];

    let events = (business as any).events;

    // Filter by date range
    events = events.filter((event: any) => {
      const eventDate = new Date(event.startAt);
      return eventDate >= dateRange.startDate && eventDate < dateRange.endDate;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter(
        (event: any) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.venueName?.toLowerCase().includes(query)
      );
    }

    return events;
  }, [(business as any)?.events, searchQuery, dateRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Business not found</h2>
        <p className="text-muted-foreground mb-4">
          The business you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/businesses">
          <Button>Browse Businesses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Business Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">{business.name}</h1>
                </div>
                {business.description && (
                  <p className="text-muted-foreground">{business.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {business.city}, {business.state}
                  </span>
                </div>
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>@{business.instagram}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  <Heart className="h-3 w-3 mr-1" />
                  {(business as any).follows?.length || 0} followers
                </Badge>
                <Badge variant="outline">
                  {(business as any).events?.length || 0} events
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <Link href={`/business/${slug}/events/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
                    isFollowing ? "fill-current" : ""
                  }`}
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

            {/* Date Range Filter */}
            <div className="flex gap-2">
              <Select
                value={dateRangeType}
                onValueChange={(value) => setDateRangeType(value as DateRange)}
              >
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

          {/* Events Grid */}
          {filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredEvents.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No events found matching your search"
                  : "No upcoming events scheduled"}
              </p>
              {isAdmin && !searchQuery && (
                <Link href={`/business/${slug}/events/new`}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
