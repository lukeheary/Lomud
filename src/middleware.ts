import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding",
  "/api/webhooks/clerk(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes without protection
  if (isPublicRoute(req)) {
    // If user is signed in and on onboarding route, check if they've completed onboarding
    if (userId && isOnboardingRoute(req)) {
      const isOnboarding = (sessionClaims?.publicMetadata as { isOnboarding?: boolean })?.isOnboarding;
      // If onboarding is complete, redirect to home
      if (isOnboarding === false) {
        return NextResponse.redirect(new URL("/home", req.url));
      }
    }
    return;
  }

  // Protect non-public routes
  await auth.protect();

  // Don't redirect API routes
  if (isApiRoute(req)) {
    return;
  }

  // Check if user needs to complete onboarding
  // If isOnboarding is true OR undefined (webhook hasn't run yet), redirect to onboarding
  // Skip this check if coming from onboarding completion (has ?from=onboarding param)
  const isOnboarding = (sessionClaims?.publicMetadata as { isOnboarding?: boolean })?.isOnboarding;
  const fromOnboarding = req.nextUrl.searchParams.get("from") === "onboarding";

  if (!fromOnboarding && (isOnboarding === true || isOnboarding === undefined)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
