"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Heart,
  Search,
  Loader2,
  Users,
} from "lucide-react";

export default function VenuesAndOrganizersPage() {
  const [venueSearch, setVenueSearch] = useState("");
  const [organizerSearch, setOrganizerSearch] = useState("");

  const { data: venues, isLoading: venuesLoading } = trpc.venue.listVenues.useQuery({
    search: venueSearch || undefined,
    limit: 50,
  });

  const { data: organizers, isLoading: organizersLoading } = trpc.organizer.listOrganizers.useQuery({
    search: organizerSearch || undefined,
    limit: 50,
  });

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Venues Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Venues</h1>
            <p className="text-muted-foreground">
              Discover local venues and event spaces
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={venueSearch}
            onChange={(e) => setVenueSearch(e.target.value)}
            className="pl-10"
          />
        </div>

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
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle className="text-lg">{venue.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {venue.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {venue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {venue.city}, {venue.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Heart className="h-3 w-3 mr-1" />
                        {(venue as any).follows?.length || 0} followers
                      </Badge>
                    </div>
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
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground mb-4">
                {venueSearch
                  ? "Try adjusting your search"
                  : "No venues available yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Organizers Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Organizers</h2>
            <p className="text-muted-foreground">
              Discover event organizers and groups
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizers..."
            value={organizerSearch}
            onChange={(e) => setOrganizerSearch(e.target.value)}
            className="pl-10"
          />
        </div>

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
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle className="text-lg">{organizer.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {organizer.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {organizer.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Heart className="h-3 w-3 mr-1" />
                        {(organizer as any).follows?.length || 0} followers
                      </Badge>
                    </div>
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
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No organizers found</h3>
              <p className="text-muted-foreground mb-4">
                {organizerSearch
                  ? "Try adjusting your search"
                  : "No organizers available yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
