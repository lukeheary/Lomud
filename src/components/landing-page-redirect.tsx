"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function LandingPageRedirect() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Once Clerk is loaded and user is signed in, check onboarding status
    if (isLoaded && isSignedIn && user) {
      const isOnboarding = (user.publicMetadata as { isOnboarding?: boolean })?.isOnboarding;

      // If user needs onboarding, redirect to onboarding
      // If isOnboarding is undefined (webhook hasn't run yet), default to onboarding
      if (isOnboarding === true || isOnboarding === undefined) {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  return null;
}
