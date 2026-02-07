"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EventForm } from "@/components/events/event-form";
import { BackButtonHeader } from "@/components/shared/back-button-header";

function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const venueId = searchParams.get("venueId") || undefined;
  const organizerId = searchParams.get("organizerId") || undefined;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      <BackButtonHeader backHref="/home" title="Create Event" />

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
