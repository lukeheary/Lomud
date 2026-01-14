"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Building2, Users, Plus, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingCheck } from "@/components/onboarding-check";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useClerk } from "@clerk/nextjs";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  const { data: user } = trpc.user.getCurrentUser.useQuery();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingCheck />
      {/* Navigation Bar */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              {/*<Calendar className="h-6 w-6" />*/}
              <span>Lomud</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Events
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  {/*<Calendar className="h-4 w-4 mr-2" />*/}
                  Calendar
                </Button>
              </Link>
              <Link href="/businesses">
                <Button variant="ghost" size="sm">
                  {/*<Building2 className="h-4 w-4 mr-2" />*/}
                  Businesses
                </Button>
              </Link>
              <Link href="/friends">
                <Button variant="ghost" size="sm">
                  {/*<Users className="h-4 w-4 mr-2" />*/}
                  Friends
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/business/new">New Business</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
