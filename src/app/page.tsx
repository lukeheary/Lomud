import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { truculenta } from "@/lib/fonts";
import { LandingPageRedirect } from "@/components/landing-page-redirect";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is logged in, redirect to home (events page)
  if (userId) {
    redirect("/home");
  }

  const fakeAvatarsByEvent = {
    midnight: [
      { id: "mid-1", firstName: "Lena", lastName: null },
      { id: "mid-2", firstName: "Jon", lastName: null },
      { id: "mid-3", firstName: "Ari", lastName: null },
      { id: "mid-4", firstName: "Maya", lastName: null },
      { id: "mid-5", firstName: "Kai", lastName: null },
    ],
    neon: [
      { id: "neo-1", firstName: "Brad", lastName: null },
      { id: "neo-2", firstName: "Ivy", lastName: null },
      { id: "neo-3", firstName: "Jack", lastName: null },
      { id: "neo-4", firstName: "Tess", lastName: null },
    ],
    rooftop: [
      { id: "roo-1", firstName: "Sage", lastName: null },
      { id: "roo-2", firstName: "Owen", lastName: null },
      { id: "roo-3", firstName: "Liv", lastName: null },
      { id: "roo-4", firstName: "Ava", lastName: null },
      { id: "roo-5", firstName: "Eli", lastName: null },
      { id: "roo-5", firstName: "Jeff", lastName: null },
    ],
  };

  const fakeEvents = [
    {
      id: "ev-1",
      title: "Midnight Frequencies",
      time: "10:00 PM",
      venue: "Skyline Hall",
      friendsCount: 14,
      image: "/landing/midnight-frequencies.png",
      avatars: fakeAvatarsByEvent.midnight,
    },
    {
      id: "ev-2",
      title: "Neon Afterhours",
      time: "8:30 PM",
      venue: "District 9",
      friendsCount: 8,
      image: "/landing/neon-afterhours.png",
      avatars: fakeAvatarsByEvent.neon,
    },
    {
      id: "ev-3",
      title: "Rooftop Reverie",
      time: "6:00 PM",
      venue: "Solstice Terrace",
      friendsCount: 5,
      image: "/landing/rooftop-reverie.png",
      avatars: fakeAvatarsByEvent.rooftop,
    },
  ];

  return (
    <>
      {/* Client-side redirect check for newly signed up users */}
      <LandingPageRedirect />
      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2 text-3xl font-black tracking-wide">
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
          <section className="container mx-auto px-4 pb-20 pt-28 md:pt-36">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
              <div className="space-y-6">
                {/*<div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">*/}
                {/*  Built for real plans*/}
                {/*</div>*/}
                <h1 className="text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                  <span className={truculenta.className}>
                    See who is going,
                    <br />
                    decide where to go.
                  </span>
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                  WIG is the social layer for events. Find what&apos;s
                  happening, see which friends are in, and make going out an
                  easy yes.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/sign-up">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
                {/*<div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">*/}
                {/*  <div>Real-time RSVP visibility</div>*/}
                {/*  <div>Friend-first discovery</div>*/}
                {/*  <div>Local events, curated</div>*/}
                {/*</div>*/}
              </div>

              <div className="relative">
                <div className="absolute -left-8 -top-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-orange-400/20 blur-3xl" />
                {/*<div className="space-y-4 rounded-2xl border bg-background/80 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)] backdrop-blur">*/}
                {/*<div className="flex items-center justify-between pb-2">*/}
                {/*  <div className="text-sm text-muted-foreground">*/}
                {/*    Tonight in your city*/}
                {/*  </div>*/}
                {/*  <div className="text-sm text-muted-foreground">12 events</div>*/}
                {/*</div>*/}
                <div className="space-y-3">
                  {fakeEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group relative rounded-2xl border bg-muted/40 p-2"
                    >
                      <div className="relative flex">
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-0.5 py-1 pl-3 pr-1">
                          <h3 className="line-clamp-2 text-base font-bold leading-tight">
                            {event.title}
                          </h3>
                          <div className="text-sm text-primary/70">
                            {event.time}
                          </div>
                          <div className="line-clamp-1 text-sm text-primary/70">
                            {event.venue}
                          </div>
                        </div>
                        <div className="absolute bottom-1 right-1">
                          <AvatarStack
                            users={event.avatars}
                            maxDisplay={3}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/*<div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">*/}
                {/*  <span>Invite friends in one tap</span>*/}
                {/*  <span>Sync your calendar</span>*/}
                {/*</div>*/}
              </div>
              {/*</div>*/}
            </div>
          </section>

          <section className="container mx-auto px-4 pb-20 pt-10">
            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-background/70 p-6 backdrop-blur">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Discover
                </div>
                <h3 className="mt-3 text-2xl font-semibold">
                  Events that fit your vibe
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Personalized discovery that puts your city&apos;s best nights
                  in one feed.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-6 backdrop-blur">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Connect
                </div>
                <h3 className="mt-3 text-2xl font-semibold">
                  See who&apos;s in
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Know what your friends are planning so you can actually meet
                  up.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-6 backdrop-blur">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Go
                </div>
                <h3 className="mt-3 text-2xl font-semibold">Plan in seconds</h3>
                <p className="mt-2 text-muted-foreground">
                  RSVP, share, and coordinate without the group chat chaos.
                </p>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto grid max-w-6xl gap-10 rounded-3xl border bg-background/70 p-10 backdrop-blur md:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  How it works
                </div>
                <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                  Your night, mapped out with your people
                </h2>
                <p className="mt-4 text-muted-foreground">
                  WIG shows you what&apos;s happening and who&apos;s going.
                  Follow friends, track venues, and lock in plans without
                  endless back-and-forth.
                </p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <div className="text-base font-semibold text-foreground">
                    1. Follow friends + places
                  </div>
                  <p>Build your scene with people you actually want to see.</p>
                </div>
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <div className="text-base font-semibold text-foreground">
                    2. Browse live events
                  </div>
                  <p>Filter by vibe, time, or who&apos;s going.</p>
                </div>
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <div className="text-base font-semibold text-foreground">
                    3. Share + lock it in
                  </div>
                  <p>Send the plan and make it real in minutes.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl border bg-background/80 p-10 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
              <h2 className="text-3xl font-semibold md:text-4xl">
                Make going out effortless
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Join WIG and always know who is going. Plans should feel easy,
                not like a spreadsheet.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/sign-up">
                  <Button size="lg">Create your account</Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline">
                    I already have one
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
