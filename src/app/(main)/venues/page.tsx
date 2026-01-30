"use client";

import Link from "next/link";
import { Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FollowFilterSelect } from "@/components/shared/follow-filter-select";

function VenuesPageContent() {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [selectedCity, setSelectedCity] = useQueryState<string | null>("city", {
    defaultValue: null,
    parse: (value) => value || null,
    serialize: (value) => value || "",
  });
  const [followingFilter, setFollowingFilter] = useQueryState("filter", {
    defaultValue: "all",
  });

  // Get current user to show their city
  const { data: currentUser, isLoading: isLoadingUser } = trpc.user.getCurrentUser.useQuery();

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  // Determine the effective city: use URL param if set, otherwise user's city
  const effectiveCity = selectedCity ?? currentUser?.city ?? null;

  // Don't run query until we know the user's city (to avoid flash of "all cities")
  const isReady = !isLoadingUser;

  const { data: venues, isLoading } = trpc.venue.listVenues.useQuery({
    search: searchQuery || undefined,
    city: effectiveCity && effectiveCity !== "all" ? effectiveCity : undefined,
    followedOnly: followingFilter === "followed",
    limit: 50,
  }, {
    enabled: isReady,
  });

  return (
    <div className="container mx-auto space-y-4 py-4">
      {/* Header */}
      {/*<div>*/}
      {/*  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">*/}
      {/*    Venues*/}
      {/*    {selectedCity !== "all" && (*/}
      {/*      <span className="text-muted-foreground"> in {selectedCity}</span>*/}
      {/*    )}*/}
      {/*  </h1>*/}
      {/*  <p className="text-muted-foreground">*/}
      {/*    Discover local venues and event spaces*/}
      {/*  </p>*/}
      {/*</div>*/}

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Suspense fallback={null}>
          <SearchInput
            placeholder="Search venues..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </Suspense>

        {/* Filters */}
        <div className="flex shrink-0 gap-2">
          <FollowFilterSelect
            value={(followingFilter as "all" | "followed") || "all"}
            onValueChange={setFollowingFilter}
            allLabel="All Venues"
            className="w-full sm:w-[150px]"
          />

          {/* City Filter */}
          <Select value={effectiveCity ?? "all"} onValueChange={setSelectedCity}>
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
      </div>

      {/* Loading State */}
      {(isLoading || !isReady) && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Venue Grid */}
      {!isLoading && venues && venues.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venue/${venue.slug}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{venue.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {venue.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {venue.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {venue.city}, {venue.state}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && venues && venues.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No venues found</h3>
            <p className="mb-4 text-muted-foreground">
              {followingFilter === "followed"
                ? "You aren't following any venues yet"
                : searchQuery
                ? "Try adjusting your search or filters"
                : "No venues available yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function VenuesPage() {
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
      <VenuesPageContent />
    </Suspense>
  );
}
