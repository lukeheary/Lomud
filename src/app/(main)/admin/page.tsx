"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Building, Building2, MapPin, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: venues } = trpc.admin.listAllPlaces.useQuery({ type: "venue" });
  const { data: organizers } = trpc.admin.listAllPlaces.useQuery({
    type: "organizer",
  });
  const { data: metroAreas } = trpc.admin.listMetroAreas.useQuery();

  const stats = [
    {
      label: "Venues",
      value: venues?.length ?? 0,
      icon: Building,
      href: "/admin/places",
    },
    {
      label: "Organizers",
      value: organizers?.length ?? 0,
      icon: Building2,
      href: "/admin/places",
    },
    {
      label: "Metro Areas",
      value: metroAreas?.length ?? 0,
      icon: MapPin,
      href: "/admin/metro-areas",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold sm:text-2xl">{stat.value}</p>
                  {/*<p className="truncate text-xs text-muted-foreground">*/}
                  {/*  {stat.description}*/}
                  {/*</p>*/}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/admin/places?create=venue">
              <Card className="p-4 hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4" />
                  <div className="text-sm font-medium">Add Venue</div>
                </div>
              </Card>
            </Link>
            <Link href="/admin/places?create=organizer">
              <Card className="p-4 hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4" />
                  <div className="text-sm font-medium">Add Organizer</div>
                </div>
              </Card>
            </Link>
            <Link href="/admin/places">
              <Card className="p-4 hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4" />
                  <div className="text-sm font-medium">Manage Places</div>
                </div>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent activity logging coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
