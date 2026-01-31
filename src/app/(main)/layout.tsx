"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MapPin,
  Building2,
  Users,
  Plus,
  User,
  LogOut,
  Menu,
  Home,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { UserAvatar } from "@/components/ui/user-avatar";
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
import { truculenta } from "@/lib/fonts";
import {
  NavbarSearchProvider,
  useNavbarSearch,
} from "@/contexts/nav-search-context";
import { cn } from "@/lib/utils";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  const { showNavbarSearch, scrollToSearchAndFocus } = useNavbarSearch();

  const receivedRequestsCount =
    pendingRequests?.filter((f) => !f.isSender).length ?? 0;

  const isHome = pathname === "/home";
  const isPlaces = pathname === "/places";
  const isFriends = pathname === "/friends";
  const isProfile = pathname === "/profile";
  const isMyVenues = pathname === "/my-venues";
  const isMyOrganizers = pathname === "/my-organizers";
  const isAdminPage = pathname?.startsWith("/admin");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link
              href="/home"
              className="flex items-center gap-2 text-4xl font-black tracking-wide"
            >
              <span className={truculenta.className}>WIG</span>
            </Link>
          </div>

          {/* Center - Desktop Navigation */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
            <Link href="/home">
              <Button
                variant="ghost"
                size="sm"
                className={isHome ? "text-foreground" : "text-muted-foreground"}
              >
                Home
              </Button>
            </Link>
            <Link href="/places">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isPlaces ? "text-foreground" : "text-muted-foreground"
                }
              >
                Places
              </Button>
            </Link>
            <Link href="/friends">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isFriends
                    ? "gap-1 text-foreground"
                    : "gap-1 text-muted-foreground"
                }
              >
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
            {/* Search button - only visible when scrolled on home/places/friends page */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                (isHome || isPlaces || isFriends) && showNavbarSearch
                  ? "w-10 opacity-100"
                  : "w-0 opacity-0"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollToSearchAndFocus}
                className="h-10 w-10"
              >
                <Search className="h-6 w-6" />
              </Button>
            </div>
            <NotificationsBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserAvatar 
                    src={user?.imageUrl} 
                    name={user?.firstName} 
                    className="h-8 w-8"
                  />
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

          {/* Mobile Right Menu - Bell and Menu */}
          <div className="flex items-center md:hidden">
            {/* Search button - only visible when scrolled on home/places/friends page */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                (isHome || isPlaces || isFriends) && showNavbarSearch
                  ? "w-10 opacity-100"
                  : "w-0 opacity-0"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollToSearchAndFocus}
                className="h-10 w-10"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
            <NotificationsBell />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={"ml-2"}>
                  <Menu className="mr-2 h-5" />
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
                      className={`w-full justify-start px-4 text-base ${isHome ? "text-foreground" : "text-muted-foreground"}`}
                      size="lg"
                    >
                      <Home className="mr-3 h-5 w-5" />
                      Home
                    </Button>
                  </Link>

                  <Link href="/places" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start px-4 text-base ${isPlaces ? "text-foreground" : "text-muted-foreground"}`}
                      size="lg"
                    >
                      <MapPin className="mr-3 h-5 w-5" />
                      Places
                    </Button>
                  </Link>
                  <Link href="/friends" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start px-4 text-base ${isFriends ? "text-foreground" : "text-muted-foreground"}`}
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
                        className={`w-full justify-start px-4 text-base ${isProfile ? "text-foreground" : "text-muted-foreground"}`}
                        size="lg"
                      >
                        <UserAvatar 
                          src={user?.imageUrl} 
                          name={user?.firstName} 
                          className="mr-3 h-5 w-5"
                        />
                        My Profile
                      </Button>
                    </Link>
                    {hasVenues && (
                      <Link href="/my-venues" onClick={closeMobileMenu}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start px-4 text-base ${isMyVenues ? "text-foreground" : "text-muted-foreground"}`}
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
                          className={`w-full justify-start px-4 text-base ${isMyOrganizers ? "text-foreground" : "text-muted-foreground"}`}
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
                          className={`w-full justify-start px-4 text-base ${isAdminPage ? "text-foreground" : "text-muted-foreground"}`}
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
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavbarSearchProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </NavbarSearchProvider>
  );
}
