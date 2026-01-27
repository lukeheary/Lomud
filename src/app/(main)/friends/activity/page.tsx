"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ActivityFeed } from "@/components/friends/activity-feed";

function ActivityPageContent() {
  return (
    <div className="container mx-auto space-y-4 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Activity
        </h1>
        <p className="text-muted-foreground">See what your friends are up to</p>
      </div>

      <ActivityFeed />
    </div>
  );
}

export default function ActivityPage() {
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
      <ActivityPageContent />
    </Suspense>
  );
}
