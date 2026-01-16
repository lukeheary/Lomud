"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Loader2 } from "lucide-react";

export default function MyOrganizersPage() {
  const { data: myOrganizers, isLoading } =
    trpc.organizer.getMyOrganizers.useQuery();

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
          My Organizers
        </h1>
        <p className="text-muted-foreground">
          Organizers where you are a member
        </p>
      </div>

      {/* Organizers Grid */}
      {myOrganizers && myOrganizers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myOrganizers.map((organizer) => (
            <Card
              key={organizer.id}
              className="transition-colors hover:bg-accent/50"
            >
              <CardHeader className={"pb-2"}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/*<Users className="h-5 w-5" />*/}
                    <CardTitle className="text-lg">{organizer.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {organizer.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {organizer.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Users className="mr-1 h-3 w-3" />
                    {(organizer as any).members?.length || 0} members
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    {(organizer as any).events?.length || 0} upcoming
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/organizer/${organizer.slug}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className={"w-full"}>
                      View Organizer
                    </Button>
                  </Link>
                  <Link
                    href={`/event/new?organizerId=${organizer.id}`}
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
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No organizers yet</h3>
            <p className="mb-4 text-muted-foreground">
              You are not a member of any organizers. Contact an admin to be
              added to an organizer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
