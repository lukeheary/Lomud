import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Calendar, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingCheck } from "@/components/onboarding-check";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingCheck />
      {/* Navigation Bar */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Calendar className="h-6 w-6" />
              <span>LocalSocial</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </Link>
              <Link href="/businesses">
                <Button variant="ghost" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Businesses
                </Button>
              </Link>
              <Link href="/friends">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Friends
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          LocalSocialCalendar - Discover local events and connect with your community
        </div>
      </footer>
    </div>
  );
}
