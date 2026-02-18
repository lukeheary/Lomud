"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { useNavbarSearch } from "@/contexts/nav-search-context";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Building2, CalendarDays, MapPin, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { getDistanceMiles, type Coordinates } from "@/lib/geo";
import { resolveMetroArea } from "@/lib/metro-areas";
import { cn } from "@/lib/utils";

type FilterType = "all" | "venues" | "organizers" | "following";

function PlaceSkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-2 py-2 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`place-skeleton-${index}`}
          className="h-28 rounded-2xl bg-card p-2"
        >
          <div className="flex h-full animate-pulse">
            <div className="h-24 w-24 flex-shrink-0 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2 py-1 pl-3 pr-1">
              <div className="h-4 w-3/4 rounded-full bg-muted" />
              <div className="h-3 w-1/2 rounded-full bg-muted" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlacesPageContent() {
  const { setShowNavbarSearch, registerScrollToSearch } = useNavbarSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Scroll to top and focus search input when navbar search button is clicked
  const scrollToSearchAndFocus = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    searchInputRef.current?.focus();
  }, []);

  // Register the scroll callback with the navbar context
  useEffect(() => {
    registerScrollToSearch(scrollToSearchAndFocus);
  }, [registerScrollToSearch, scrollToSearchAndFocus]);

  // Update navbar search button visibility based on scroll position
  useEffect(() => {
    setShowNavbarSearch(isSticky);
  }, [isSticky, setShowNavbarSearch]);

  // Observe when the search section scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" }
    );

    const sentinel = stickySentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

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

  // Determine the effective city: use URL param if set, otherwise resolve user's city to metro
  const effectiveCity = useMemo(() => {
    if (selectedCity) return selectedCity;
    if (!currentUser?.city) return null;
    if (!cities) return currentUser.city;
    const metro = resolveMetroArea(currentUser.city, currentUser.state, cities);
    return metro?.city ?? currentUser.city;
  }, [selectedCity, currentUser?.city, currentUser?.state, cities]);

  const referenceCity =
    selectedCity && selectedCity !== "all"
      ? selectedCity
      : (effectiveCity ?? null);

  const referenceCityRecord = useMemo(() => {
    if (!referenceCity || !cities) return null;
    const matches = cities.filter((city) => city.city === referenceCity);
    if (matches.length === 0) return null;
    if (currentUser?.state) {
      const preferred = matches.find(
        (city) => city.state === currentUser.state
      );
      if (preferred) return preferred;
    }
    return matches[0];
  }, [referenceCity, cities, currentUser?.state]);

  const referenceCoords = useMemo<Coordinates | null>(() => {
    if (
      referenceCityRecord?.latitude == null ||
      referenceCityRecord?.longitude == null
    ) {
      return null;
    }
    return {
      latitude: referenceCityRecord.latitude,
      longitude: referenceCityRecord.longitude,
    };
  }, [referenceCityRecord]);

  const cityDistanceMap = useMemo(() => {
    if (!cities || !referenceCoords) return new Map<string, number>();

    const map = new Map<string, number>();
    cities.forEach((city) => {
      if (city.latitude == null || city.longitude == null) return;
      const distance = getDistanceMiles(referenceCoords, {
        latitude: city.latitude,
        longitude: city.longitude,
      });
      if (distance != null) {
        map.set(`${city.city}|${city.state}`, distance);
      }
    });

    return map;
  }, [cities, referenceCoords]);

  // Don't run queries until we know the user's city (to avoid flash of "all cities")
  const isReady = !isLoadingUser;

  // Determine place type filter
  const placeType =
    filterType === "venues"
      ? "venue"
      : filterType === "organizers"
        ? "organizer"
        : undefined;

  // Fetch places
  const { data: placesData, isLoading: isLoadingPlaces } =
    trpc.place.listPlaces.useQuery(
      {
        type: placeType,
        search: searchQuery || undefined,
        city:
          effectiveCity && effectiveCity !== "all" ? effectiveCity : undefined,
        followedOnly: filterType === "following",
        limit: 50,
      },
      {
        enabled: isReady,
      }
    );

  // Combine and sort places alphabetically
  const combinedItems = useMemo(() => {
    if (!placesData) return [];

    return placesData
      .map((place) => ({
        type: place.type,
        id: place.id,
        name: place.name,
        description: place.description,
        city: place.city,
        state: place.state,
        slug: place.slug,
        logoImageUrl: place.logoImageUrl,
        latitude: place.latitude,
        longitude: place.longitude,
        eventCount: place.eventCount,
      }))
      .sort((a, b) => {
        if (referenceCoords) {
          const aDistance =
            getDistanceMiles(
              a.latitude != null && a.longitude != null
                ? { latitude: a.latitude, longitude: a.longitude }
                : null,
              referenceCoords
            ) ??
            (a.city && a.state
              ? cityDistanceMap.get(`${a.city}|${a.state}`)
              : null) ??
            Number.POSITIVE_INFINITY;

          const bDistance =
            getDistanceMiles(
              b.latitude != null && b.longitude != null
                ? { latitude: b.latitude, longitude: b.longitude }
                : null,
              referenceCoords
            ) ??
            (b.city && b.state
              ? cityDistanceMap.get(`${b.city}|${b.state}`)
              : null) ??
            Number.POSITIVE_INFINITY;

          if (aDistance !== bDistance) return aDistance - bDistance;
        }

        return a.name.localeCompare(b.name);
      });
  }, [placesData, referenceCoords, cityDistanceMap]);

  const isLoading = isLoadingPlaces;

  return (
    <div className="container mx-auto pt-4">
      {/* Sticky sentinel for intersection observer */}
      <div ref={stickySentinelRef} className="h-0" />

      {/* Search and Filters */}
      <div className="z-[45] -mx-4 -mt-4 bg-background px-4 pb-3 pt-2 transition-shadow md:top-16 md:z-30 md:-mx-8 md:bg-background/95 md:px-8 md:backdrop-blur md:supports-[backdrop-filter]:bg-background">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Suspense fallback={null}>
            <SearchInput
              ref={searchInputRef}
              placeholder="Search venues & organizers..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </Suspense>

          {/* Filters */}
          <div className="flex shrink-0 gap-2">
            {/* Type Filter */}
            <ResponsiveSelect
              value={filterType}
              onValueChange={(value) => setFilterType(value as FilterType)}
              options={[
                { value: "all", label: "All" },
                { value: "venues", label: "Venues" },
                { value: "organizers", label: "Organizers" },
                { value: "following", label: "Following" },
              ]}
              placeholder="Filter"
              title="Filter Places"
              className="w-40 sm:w-[170px]"
            />

            {/* City Filter */}
            <ResponsiveSelect
              value={effectiveCity ?? "all"}
              onValueChange={setSelectedCity}
              options={[
                { value: "all", label: "All Cities" },
                ...(cities?.map((city) => ({
                  value: city.city,
                  label: `${city.city}, ${city.state}`,
                })) || []),
              ]}
              placeholder="Select city"
              title="Select City"
              className="w-48 grow"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(isLoading || !isReady) && <PlaceSkeletonGrid />}

      {/* Combined Grid */}
      {!isLoading && isReady && combinedItems.length > 0 && (
        <div className="grid gap-2 py-2 md:grid-cols-2 lg:grid-cols-3">
          {combinedItems.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/${item.type === "venue" ? "venue" : "organizer"}/${item.slug}`}
            >
              <Card className="relative h-28 cursor-pointer overflow-hidden !border-none bg-card p-2 transition-all duration-300 hover:bg-accent/50">
                <div className="flex h-full">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {item.logoImageUrl ? (
                      <Image
                        src={item.logoImageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {item.type === "venue" ? (
                          <Building className="h-8 w-8 text-muted-foreground/40" />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between py-1 pl-3 pr-1">
                    <div className="space-y-1">
                      <h3 className="line-clamp-2 text-base font-bold leading-tight">
                        {item.name}
                      </h3>
                      {item.city && item.state && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {item.city}, {item.state}
                          </span>
                        </div>
                      )}
                      <div className={cn(
                        "flex items-center gap-1.5 text-sm",
                        item.eventCount === 0 ? "text-muted-foreground/40" : "text-muted-foreground"
                      )}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          {item.eventCount} upcoming {item.eventCount === 1 ? "event" : "events"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground/50">
                        {item.type === "venue" ? "Venue" : "Organizer"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && isReady && combinedItems.length === 0 && (
        <Card className={"mt-4"}>
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
