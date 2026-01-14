"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export function OnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = trpc.user.getCurrentUser.useQuery();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't redirect if we're already on onboarding page
    if (pathname === "/onboarding") {
      setIsChecking(false);
      return;
    }

    // If still loading, keep checking state true
    if (isLoading) {
      return;
    }

    // Redirect to onboarding if username starts with "user_" (temporary username)
    if (user && user.username.startsWith("user_")) {
      router.push("/onboarding");
      return;
    }

    // User is good, stop checking
    setIsChecking(false);
  }, [user, isLoading, pathname, router]);

  // Show loading screen while checking onboarding status
  if (isChecking && isLoading && pathname !== "/onboarding") {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return null;
}
