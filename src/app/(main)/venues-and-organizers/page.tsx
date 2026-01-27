"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function VenuesAndOrganizersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/venues");
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
