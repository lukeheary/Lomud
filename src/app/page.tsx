import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Sparkles } from "lucide-react";
import { truculenta } from "@/lib/fonts";
import { LandingPageRedirect } from "@/components/landing-page-redirect";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is logged in, redirect to home (events page)
  if (userId) {
    redirect("/home");
  }

  return (
    <>
      {/* Client-side redirect check for newly signed up users */}
      <LandingPageRedirect />
      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2 text-4xl font-black tracking-wide">
              <span className={truculenta.className}>WIG</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1">
          <section className="container mx-auto px-4 pb-32 pt-48">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-6xl font-bold leading-none tracking-tight md:text-8xl">
                  <span className={truculenta.className}>Who Is Going?</span>
                </h1>
                <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                  Your social calendar for going out.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-5xl">
              {/*<h2 className="mb-12 text-center text-3xl font-bold">*/}
              {/*  Everything you need to stay connected*/}
              {/*</h2>*/}
              <div className="grid gap-8 md:grid-cols-3">
                {/* Feature 1 */}
                <div className="space-y-2">
                  {/*<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">*/}
                  {/*  <Calendar className="h-6 w-6 text-primary" />*/}
                  {/*</div>*/}
                  <h3 className="text-2xl font-semibold">Discover events</h3>
                  <p className="text-muted-foreground">
                    Find local events that match your interests and never miss
                    out again.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="space-y-2">
                  {/*<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">*/}
                  {/*  <Users className="h-6 w-6 text-primary" />*/}
                  {/*</div>*/}
                  <h3 className="text-2xl font-semibold">
                    Connect with friends
                  </h3>
                  <p className="text-muted-foreground">
                    See which events your friends are attending and plan
                    together.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="space-y-2">
                  {/*<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">*/}
                  {/*  <MapPin className="h-6 w-6 text-primary" />*/}
                  {/*</div>*/}
                  <h3 className="text-2xl font-semibold">Local First</h3>
                  <p className="text-muted-foreground">
                    Discover what&apos;s happening in your neighborhood and
                    support local businesses.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          {/*<section className="container mx-auto border-t px-4 py-20">*/}
          {/*  <div className="mx-auto max-w-3xl space-y-6 text-center">*/}
          {/*    /!*<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">*!/*/}
          {/*    /!*  <Sparkles className="h-8 w-8 text-primary" />*!/*/}
          {/*    /!*</div>*!/*/}
          {/*    <h2 className="text-3xl font-bold md:text-4xl">*/}
          {/*      Ready to get started?*/}
          {/*    </h2>*/}
          {/*    <p className="text-xl text-muted-foreground">*/}
          {/*      Join thousands of people discovering and attending local events.*/}
          {/*    </p>*/}
          {/*    <Link href="/sign-up">*/}
          {/*      <Button size="lg" className="px-8 text-lg">*/}
          {/*        Create Your Account*/}
          {/*      </Button>*/}
          {/*    </Link>*/}
          {/*  </div>*/}
          {/*</section>*/}
        </main>

        {/* Footer */}
        {/*<footer className="border-t py-6">*/}
        {/*  <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">*/}
        {/*    <span className={truculenta.className}>WIG</span> - Discover local*/}
        {/*    events and connect with your community*/}
        {/*  </div>*/}
        {/*</footer>*/}
      </div>
    </>
  );
}
