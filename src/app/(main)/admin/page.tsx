"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Building, Building2, Calendar } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: venues } = trpc.admin.listAllPlaces.useQuery({ type: "venue" });
  const { data: organizers } = trpc.admin.listAllPlaces.useQuery({ type: "organizer" });

  const stats = [
    {
      label: "Total Venues",
      value: venues?.length ?? 0,
      icon: Building,
      href: "/admin/places",
      description: "Manage physical locations",
    },
    {
      label: "Total Organizers",
      value: organizers?.length ?? 0,
      icon: Building2,
      href: "/admin/places",
      description: "Manage event creators",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
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
