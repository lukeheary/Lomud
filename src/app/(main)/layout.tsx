"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Building2,
  Users,
  Plus,
  User,
  LogOut,
  Menu,
} from "lucide-react";
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
  const { data: hasVenues } = trpc.user.hasVenues.useQuery();
  const { data: hasOrganizers } = trpc.user.hasOrganizers.useQuery();
  const { data: pendingRequests } = trpc.friends.listFriends.useQuery({
    statusFilter: "pending",
  });

  const receivedRequestsCount =
    pendingRequests?.filter((f) => !f.isSender).length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <OnboardingCheck />
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link
              href="/home"
              className="flex items-center gap-2 text-xl font-bold"
            >
              <span>Lomud</span>
            </Link>
          </div>

          {/* Center - Desktop Navigation */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                Events
              </Button>
            </Link>
            <Link href="/venues">
              <Button variant="ghost" size="sm" className="gap-1">
                {/*<Building2 className="h-4 w-4" />*/}
                Venues
              </Button>
            </Link>
            <Link href="/organizers">
              <Button variant="ghost" size="sm" className="gap-1">
                {/*<Users className="h-4 w-4" />*/}
                Organizers
              </Button>
            </Link>
            <Link href="/friends">
              <Button variant="ghost" size="sm" className="gap-1">
                Friends
                {receivedRequestsCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {receivedRequestsCount}
                  </span>
                )}
              </Button>
            </Link>
          </nav>

          {/* Right Side - Spacer for mobile */}
          <div className="flex-1" />

          {/* Desktop Right Menu */}
          <div className="hidden items-center gap-2 md:flex">
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
                  <Link
                    href="/profile"
                    className="flex cursor-pointer items-center gap-4"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                {hasVenues && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/my-venues"
                      className="flex cursor-pointer items-center gap-4"
                    >
                      <Building2 className="h-4 w-4" />
                      My Venues
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasOrganizers && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/my-organizers"
                      className="flex cursor-pointer items-center gap-4"
                    >
                      <Users className="h-4 w-4" />
                      My Organizers
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="flex cursor-pointer items-center gap-4"
                    >
                      <Plus className="h-4 w-4" />
                      Admin Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer gap-4 text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Right Menu - Bell, Avatar, and Menu */}
          <div className="flex items-center gap-1 md:hidden">
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
                  <Link
                    href="/profile"
                    className="flex cursor-pointer items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                {hasVenues && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/my-venues"
                      className="flex cursor-pointer items-center"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      My Venues
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasOrganizers && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/my-organizers"
                      className="flex cursor-pointer items-center"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      My Organizers
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="flex cursor-pointer items-center"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Admin Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
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
              <SheetTitle></SheetTitle>
              <SheetContent
                side="right"
                className="w-[300px] px-4 sm:w-[400px]"
              >
                <SheetHeader></SheetHeader>
                <nav className="mt-8 flex flex-col gap-2">
                  <Link href="/home" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 text-base"
                      size="lg"
                    >
                      <Calendar className="mr-3 h-5 w-5" />
                      Events
                    </Button>
                  </Link>

                  <Link href="/venues" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 text-base"
                      size="lg"
                    >
                      <Building2 className="mr-3 h-5 w-5" />
                      Venues
                    </Button>
                  </Link>
                  <Link href="/organizers" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 text-base"
                      size="lg"
                    >
                      <Users className="mr-3 h-5 w-5" />
                      Organizers
                    </Button>
                  </Link>
                  <Link href="/friends" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 text-base"
                      size="lg"
                    >
                      <Users className="mr-3 h-5 w-5" />
                      Friends
                      {receivedRequestsCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                          {receivedRequestsCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                    <Link href="/profile" onClick={closeMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 text-base"
                        size="lg"
                      >
                        <User className="mr-3 h-5 w-5" />
                        My Profile
                      </Button>
                    </Link>
                    {hasVenues && (
                      <Link href="/my-venues" onClick={closeMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 text-base"
                          size="lg"
                        >
                          <Building2 className="mr-3 h-5 w-5" />
                          My Venues
                        </Button>
                      </Link>
                    )}
                    {hasOrganizers && (
                      <Link href="/my-organizers" onClick={closeMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 text-base"
                          size="lg"
                        >
                          <Users className="mr-3 h-5 w-5" />
                          My Organizers
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" onClick={closeMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 text-base"
                          size="lg"
                        >
                          <Plus className="mr-3 h-5 w-5" />
                          Admin Settings
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 text-base text-red-500"
                      size="lg"
                      onClick={() => {
                        closeMobileMenu();
                        handleSignOut();
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
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
