"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Heart,
  Plus,
  Search,
  Loader2,
} from "lucide-react";

export default function BusinessesPage() {
  const [search, setSearch] = useState("");

  const { data: businesses, isLoading } = trpc.business.listBusinesses.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  return (
    <div className="container mx-auto py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground">
            Discover local businesses and venues
          </p>
        </div>
        {isAdmin && (
          <Link href="/business/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Business Grid */}
      {!isLoading && businesses && businesses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business.id} href={`/business/${business.slug}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {business.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {business.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {business.city}, {business.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Heart className="h-3 w-3 mr-1" />
                      {(business as any).follows?.length || 0} followers
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && businesses && businesses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Try adjusting your search"
                : "No businesses available yet"}
            </p>
            {!search && isAdmin && (
              <Link href="/business/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
