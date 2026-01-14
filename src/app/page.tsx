import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is logged in, redirect to home (events page)
  if (userId) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span>Lomud</span>
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
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Discover Local Events
                <br />
                <span className="text-primary">Connect with Friends</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find and attend amazing events in your area. See what your friends are going to and never miss out on the fun.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 border-t">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything you need to stay connected
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Event Discovery</h3>
                <p className="text-muted-foreground">
                  Browse local events by category, date, or venue. Find exactly what you're looking for.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Friend Network</h3>
                <p className="text-muted-foreground">
                  See which events your friends are attending and plan together.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Local First</h3>
                <p className="text-muted-foreground">
                  Discover what's happening in your neighborhood and support local businesses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 border-t">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of people discovering and attending local events.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Lomud - Discover local events and connect with your community
        </div>
      </footer>
    </div>
  );
}
