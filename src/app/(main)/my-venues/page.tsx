"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Calendar,
  Users as UsersIcon,
  Loader2,
  Edit,
} from "lucide-react";

export default function MyVenuesPage() {
  const { data: myVenues, isLoading } = trpc.venue.getMyVenues.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Venues</h1>
        <p className="text-muted-foreground">
          Venues where you are a member
        </p>
      </div>

      {/* Venues Grid */}
      {myVenues && myVenues.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myVenues.map((venue) => (
            <Card key={venue.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <UsersIcon className="h-3 w-3 mr-1" />
                    {(venue as any).members?.length || 0} members
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {(venue as any).events?.length || 0} upcoming
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Link href={`/venue/${venue.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Venue
                    </Button>
                  </Link>
                  <Link href={`/event/new?venueId=${venue.id}`}>
                    <Button>
                      Create Event
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No venues yet</h3>
            <p className="text-muted-foreground mb-4">
              You are not a member of any venues. Contact an admin to be added to a venue.
            </p>
            <Link href="/venues">
              <Button>Browse Venues</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
