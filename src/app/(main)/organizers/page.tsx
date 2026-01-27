"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function OrganizersPageContent() {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [selectedCity, setSelectedCity] = useQueryState("city", {
    defaultValue: "all",
  });
  const [hasSetInitialCity, setHasSetInitialCity] = useState(false);

  // Get current user to show their city
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  // Set default city to user's city on initial load only
  useEffect(() => {
    if (currentUser?.city && selectedCity === "all" && !hasSetInitialCity) {
      void setSelectedCity(currentUser.city, { scroll: false, shallow: true });
      setHasSetInitialCity(true);
    }
  }, [currentUser, selectedCity, hasSetInitialCity, setSelectedCity]);

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  const { data: organizers, isLoading } =
    trpc.organizer.listOrganizers.useQuery({
      search: searchQuery || undefined,
      city: selectedCity !== "all" ? selectedCity : undefined,
      limit: 50,
    });

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Organizers
          {selectedCity !== "all" && (
            <span className="text-muted-foreground"> in {selectedCity}</span>
          )}
        </h1>
        <p className="text-muted-foreground">
          Discover event organizers and groups
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Suspense fallback={null}>
          <SearchInput
            placeholder="Search organizers..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </Suspense>

        {/* City Filter */}
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full shrink-0 md:w-fit">
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Organizer Grid */}
      {!isLoading && organizers && organizers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizers.map((organizer) => (
            <Link key={organizer.id} href={`/organizer/${organizer.slug}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {/*<Users className="h-5 w-5" />*/}
                      <CardTitle className="text-lg">
                        {organizer.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organizer.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {organizer.description}
                    </p>
                  )}
                  {organizer.city && organizer.state && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {organizer.city}, {organizer.state}
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
      {!isLoading && organizers && organizers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No organizers found</h3>
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No organizers available yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrganizersPage() {
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
      <OrganizersPageContent />
    </Suspense>
  );
}
