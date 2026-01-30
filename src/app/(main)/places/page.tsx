"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Building2, MapPin, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "venues" | "organizers" | "following";

function PlacesPageContent() {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [selectedCity, setSelectedCity] = useQueryState<string | null>("city", {
    defaultValue: null,
    parse: (value) => value || null,
    serialize: (value) => value || "",
  });
  const [filterType, setFilterType] = useQueryState<FilterType>("filter", {
    defaultValue: "all",
    parse: (value) =>
      ["all", "venues", "organizers", "following"].includes(value || "")
        ? (value as FilterType)
        : "all",
    serialize: (value) => value,
  });

  // Get current user to show their city
  const { data: currentUser, isLoading: isLoadingUser } =
    trpc.user.getCurrentUser.useQuery();

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  // Determine the effective city: use URL param if set, otherwise user's city
  const effectiveCity = selectedCity ?? currentUser?.city ?? null;

  // Don't run queries until we know the user's city (to avoid flash of "all cities")
  const isReady = !isLoadingUser;

  // Fetch venues (unless filtering to organizers only)
  const { data: venues, isLoading: isLoadingVenues } =
    trpc.venue.listVenues.useQuery(
      {
        search: searchQuery || undefined,
        city:
          effectiveCity && effectiveCity !== "all" ? effectiveCity : undefined,
        followedOnly: filterType === "following",
        limit: 50,
      },
      {
        enabled: isReady && filterType !== "organizers",
      }
    );

  // Fetch organizers (unless filtering to venues only)
  const { data: organizers, isLoading: isLoadingOrganizers } =
    trpc.organizer.listOrganizers.useQuery(
      {
        search: searchQuery || undefined,
        city:
          effectiveCity && effectiveCity !== "all" ? effectiveCity : undefined,
        followedOnly: filterType === "following",
        limit: 50,
      },
      {
        enabled: isReady && filterType !== "venues",
      }
    );

  // Combine and sort venues and organizers alphabetically
  const combinedItems = useMemo(() => {
    const items: Array<{
      type: "venue" | "organizer";
      id: string;
      name: string;
      description: string | null;
      city: string | null;
      state: string | null;
      slug: string;
    }> = [];

    if (filterType !== "organizers" && venues) {
      venues.forEach((venue) => {
        items.push({
          type: "venue",
          id: venue.id,
          name: venue.name,
          description: venue.description,
          city: venue.city,
          state: venue.state,
          slug: venue.slug,
        });
      });
    }

    if (filterType !== "venues" && organizers) {
      organizers.forEach((organizer) => {
        items.push({
          type: "organizer",
          id: organizer.id,
          name: organizer.name,
          description: organizer.description,
          city: organizer.city,
          state: organizer.state,
          slug: organizer.slug,
        });
      });
    }

    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [venues, organizers, filterType]);

  const isLoading =
    (filterType !== "organizers" && isLoadingVenues) ||
    (filterType !== "venues" && isLoadingOrganizers);

  return (
    <div className="container mx-auto space-y-4 py-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Suspense fallback={null}>
          <SearchInput
            placeholder="Search venues & organizers..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </Suspense>

        {/* Filters */}
        <div className="flex shrink-0 gap-2">
          {/* Type Filter */}
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as FilterType)}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Places</SelectItem>
              <SelectItem value="venues">Venues</SelectItem>
              <SelectItem value="organizers">Organizers</SelectItem>
              <SelectItem value="following">Following</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select
            value={effectiveCity ?? "all"}
            onValueChange={setSelectedCity}
          >
            <SelectTrigger className="w-full md:w-fit">
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
        </div>
      </div>

      {/* Loading State */}
      {(isLoading || !isReady) && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Combined Grid */}
      {!isLoading && isReady && combinedItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {combinedItems.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={
                item.type === "venue"
                  ? `/venue/${item.slug}`
                  : `/organizer/${item.slug}`
              }
            >
              <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === "venue" ? (
                        <Building className="h-5 w-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.city && item.state && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {item.city}, {item.state}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && isReady && combinedItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex justify-center gap-2">
              <Building className="h-10 w-10 text-muted-foreground" />
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No results found</h3>
            <p className="mb-4 text-muted-foreground">
              {filterType === "following"
                ? "You aren't following any venues or organizers yet"
                : searchQuery
                  ? "Try adjusting your search or filters"
                  : "No venues or organizers available yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <PlacesPageContent />
    </Suspense>
  );
}
