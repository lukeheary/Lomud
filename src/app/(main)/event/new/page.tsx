"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { EventForm } from "@/components/events/event-form";

function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const venueId = searchParams.get("venueId") || undefined;
  const organizerId = searchParams.get("organizerId") || undefined;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={
            venueId
              ? `/venue/${venueId}`
              : organizerId
                ? `/organizer/${organizerId}`
                : "/home"
          }
        >
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Create Event
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to create a new event
          </p>
        </div>
      </div>

      <EventForm
        venueId={venueId}
        organizerId={organizerId}
        onSuccess={(eventId) => {
          router.push(`/event/${eventId}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function NewEventPage() {
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
      <NewEventPageContent />
    </Suspense>
  );
}
