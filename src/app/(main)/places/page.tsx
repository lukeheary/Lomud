"use client";

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
import { ResponsiveSelect } from "@/components/ui/responsive-select";

type FilterType = "all" | "venues" | "organizers" | "following";

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

  // Determine the effective city: use URL param if set, otherwise user's city
  const effectiveCity = selectedCity ?? currentUser?.city ?? null;

  // Don't run queries until we know the user's city (to avoid flash of "all cities")
  const isReady = !isLoadingUser;

  // Determine place type filter
  const placeType = filterType === "venues" ? "venue" : filterType === "organizers" ? "organizer" : undefined;

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
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [placesData]);

  const isLoading = isLoadingPlaces;

  return (
    <div className="container mx-auto py-4">
      {/* Sticky sentinel for intersection observer */}
      <div ref={stickySentinelRef} className="h-0" />

      {/* Search and Filters */}
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
              { value: "all", label: "All Places" },
              { value: "venues", label: "Venues" },
              { value: "organizers", label: "Organizers" },
              { value: "following", label: "Following" },
            ]}
            placeholder="Filter"
            title="Filter Places"
            className="w-full sm:w-[170px]"
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
            className="w-full md:w-fit"
          />
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
        <div className="grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
          {combinedItems.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/place/${item.slug}`}
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
