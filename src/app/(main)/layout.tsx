"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Building2, Users, Plus, User, LogOut, Menu } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useClerk } from "@clerk/nextjs";
import { NotificationsBell } from "@/components/notifications-bell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  const { data: user } = trpc.user.getCurrentUser.useQuery();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingCheck />
      {/* Navigation Bar */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center gap-2 font-bold text-xl">
              <span>Lomud</span>
            </Link>
          </div>

          {/* Center - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                Events
              </Button>
            </Link>
            {/*<Link href="/calendar">*/}
            {/*  <Button variant="ghost" size="sm">*/}
            {/*    Calendar*/}
            {/*  </Button>*/}
            {/*</Link>*/}
            <Link href="/businesses">
              <Button variant="ghost" size="sm">
                Businesses
              </Button>
            </Link>
            <Link href="/friends">
              <Button variant="ghost" size="sm">
                Friends
              </Button>
            </Link>
          </nav>

          {/* Right Side - Spacer for mobile */}
          <div className="flex-1" />

          {/* Desktop Right Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className={'bg-green-500'}>
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
            <NotificationsBell />
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

          {/* Mobile Right Menu - Bell, Avatar, and Menu */}
          <div className="flex md:hidden items-center gap-1">
            <NotificationsBell />
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

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/home" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Calendar className="h-5 w-5 mr-3" />
                      Events
                    </Button>
                  </Link>
                  {/*<Link href="/calendar" onClick={closeMobileMenu}>*/}
                  {/*  <Button variant="ghost" className="w-full justify-start" size="lg">*/}
                  {/*    <Calendar className="h-5 w-5 mr-3" />*/}
                  {/*    Calendar*/}
                  {/*  </Button>*/}
                  {/*</Link>*/}
                  <Link href="/businesses" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Building2 className="h-5 w-5 mr-3" />
                      Businesses
                    </Button>
                  </Link>
                  <Link href="/friends" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Users className="h-5 w-5 mr-3" />
                      Friends
                    </Button>
                  </Link>

                  <div className="border-t pt-4 mt-4">
                    <Link href="/profile" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start" size="lg">
                        <User className="h-5 w-5 mr-3" />
                        My Profile
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/business/new" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start" size="lg">
                          <Plus className="h-5 w-5 mr-3" />
                          New Business
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      size="lg"
                      onClick={() => {
                        closeMobileMenu();
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {/*<footer className="border-t py-6 mt-12">*/}
      {/*  <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">*/}
      {/*    LocalSocialCalendar - Discover local events and connect with your community*/}
      {/*  </div>*/}
      {/*</footer>*/}
    </div>
  );
}
