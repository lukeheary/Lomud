"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { trpc } from "@/lib/trpc";
import { EventCardGrid } from "@/components/events/event-card-grid";
import { SearchInput } from "@/components/ui/search-input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Loader2, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingEventsPreview() {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const limit = isDesktop ? 8 : 4;

  const { data: cities } = trpc.event.getAvailableCities.useQuery();

  const { data: events, isLoading } =
    trpc.event.listPublicEventsPreview.useQuery({
      search: search || undefined,
      city: selectedCity !== "all" ? selectedCity : undefined,
      limit,
    });

  return (
    <div className="space-y-6">
      <div className="">
        <h2 className="text-3xl font-semibold md:text-4xl">Happening soon</h2>
        <p className="mt-2 text-muted-foreground">
          Real events from venues and organizers on WIG
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search events..."
          value={search}
          onChange={setSearch}
          className="w-full sm:flex-1"
        />
        <ResponsiveSelect
          value={selectedCity}
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
          className="shrink-0 sm:w-[200px]"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !events || events.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No events found</h3>
          <p className="text-muted-foreground">
            Check back later for upcoming events
          </p>
        </div>
      ) : (
        <EventCardGrid
          events={events}
          columns={{ mobile: 1, tablet: 3, desktop: 4 }}
          gap="md"
        />
      )}

      {/*<div className="flex justify-center pt-2">*/}
      {/*  <Link href="/sign-up">*/}
      {/*    <Button size="lg" variant="outline">*/}
      {/*      Sign up to see more*/}
      {/*    </Button>*/}
      {/*  </Link>*/}
      {/*</div>*/}
    </div>
  );
}
