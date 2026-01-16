"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Heart, Loader2, Users } from "lucide-react";
import { useQueryState } from "nuqs";
import { Suspense, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewType = "venues" | "organizers";

function VenuesAndOrganizersPageContent() {
  const [activeView, setActiveView] = useState<ViewType>("venues");
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [selectedCity, setSelectedCity] = useQueryState("city", {
    defaultValue: "all",
  });

  // Get available cities
  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  const { data: venues, isLoading: venuesLoading } =
    trpc.venue.listVenues.useQuery({
      search: searchQuery || undefined,
      city: selectedCity !== "all" ? selectedCity : undefined,
      limit: 50,
    });

  const { data: organizers, isLoading: organizersLoading } =
    trpc.organizer.listOrganizers.useQuery({
      search: searchQuery || undefined,
      city: selectedCity !== "all" ? selectedCity : undefined,
      limit: 50,
    });

  return (
    <div className="container mx-auto space-y-4 py-8">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {activeView === "venues" ? "Venues" : "Organizers"}
            {selectedCity !== "all" && (
              <span className="text-muted-foreground"> in {selectedCity}</span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {activeView === "venues"
              ? "Discover local venues and event spaces"
              : "Discover event organizers and groups"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as ViewType)}
        >
          <TabsList>
            <TabsTrigger value="venues" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="organizers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organizers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Suspense fallback={null}>
          <SearchInput
            placeholder={`Search ${activeView}...`}
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

      {/* Venues Section */}
      {activeView === "venues" && (
        <div>
          {/* Loading State */}
          {venuesLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Venue Grid */}
          {!venuesLoading && venues && venues.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <Link key={venue.id} href={`/venue/${venue.slug}`}>
                <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                  <CardHeader className={"pb-2"}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {/*<Building2 className="h-5 w-5" />*/}
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
                    {/*<div className="flex items-center gap-2">*/}
                    {/*  <Badge variant="outline">*/}
                    {/*    <Heart className="mr-1 h-3 w-3" />*/}
                    {/*    {(venue as any).follows?.length || 0} followers*/}
                    {/*  </Badge>*/}
                    {/*</div>*/}
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
          )}

          {/* Empty State */}
          {!venuesLoading && venues && venues.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No venues found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "No venues available yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Organizers Section */}
      {activeView === "organizers" && (
        <div>
          {/* Loading State */}
          {organizersLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Organizer Grid */}
          {!organizersLoading && organizers && organizers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizers.map((organizer) => (
              <Link key={organizer.id} href={`/organizer/${organizer.slug}`}>
                <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                  <CardHeader className={"pb-2"}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
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
                    {/*<div className="flex items-center gap-2">*/}
                    {/*  <Badge variant="outline">*/}
                    {/*    <Heart className="mr-1 h-3 w-3" />*/}
                    {/*    {(organizer as any).follows?.length || 0} followers*/}
                    {/*  </Badge>*/}
                    {/*</div>*/}
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
          )}

          {/* Empty State */}
          {!organizersLoading && organizers && organizers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No organizers found
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "No organizers available yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function VenuesAndOrganizersPage() {
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
      <VenuesAndOrganizersPageContent />
    </Suspense>
  );
}
