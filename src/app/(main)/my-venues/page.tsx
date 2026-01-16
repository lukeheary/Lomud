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
    <div className="container mx-auto space-y-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          My Venues
        </h1>
        <p className="text-muted-foreground">Venues where you are a member</p>
      </div>

      {/* Venues Grid */}
      {myVenues && myVenues.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myVenues.map((venue) => (
            <Card
              key={venue.id}
              className="transition-colors hover:bg-accent/50"
            >
              <CardHeader className={"pb-2"}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/*<Building2 className="h-5 w-5" />*/}
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <UsersIcon className="mr-1 h-3 w-3" />
                    {(venue as any).members?.length || 0} members
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    {(venue as any).events?.length || 0} upcoming
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Link href={`/venue/${venue.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Venue
                    </Button>
                  </Link>
                  <Link
                    href={`/event/new?venueId=${venue.id}`}
                    className={"flex-1"}
                  >
                    <Button className={"w-full"}>Create Event</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No venues yet</h3>
            <p className="mb-4 text-muted-foreground">
              You are not a member of any venues. Contact an admin to be added
              to a venue.
            </p>
            <Link href="/venues-and-organizers">
              <Button>Browse Venues</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
