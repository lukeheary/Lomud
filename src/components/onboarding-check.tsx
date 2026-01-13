"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function OnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = trpc.user.getCurrentUser.useQuery();

  useEffect(() => {
    // Don't redirect if we're still loading or already on onboarding page
    if (isLoading || pathname === "/onboarding") {
      return;
    }

    // Redirect to onboarding if username starts with "user_" (temporary username)
    if (user && user.username.startsWith("user_")) {
      router.push("/onboarding");
    }
  }, [user, isLoading, pathname, router]);

  return null;
}
