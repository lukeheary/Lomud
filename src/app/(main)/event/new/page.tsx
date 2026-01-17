"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, ArrowLeft, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { US_STATES } from "@/lib/utils";
import { S3Uploader } from "@/components/ui/s3-uploader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

const EVENT_CATEGORIES = [
  "music",
  "food",
  "art",
  "sports",
  "nightlife",
  "community",
  "other",
] as const;

function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const venueId = searchParams.get("venueId") || undefined;
  const organizerId = searchParams.get("organizerId") || undefined;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "" as (typeof EVENT_CATEGORIES)[number],
    startAt: "",
    endAt: "",
    venueName: "",
    address: "",
    city: "",
    state: "",
  });

  const [venueSearch, setVenueSearch] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [isCreatingNewVenue, setIsCreatingNewVenue] = useState(false);
  const [isVenuePopoverOpen, setIsVenuePopoverOpen] = useState(false);

  const { data: searchResults, isLoading: isSearchingVenues } =
    trpc.venue.searchVenues.useQuery(
      { query: venueSearch },
      { enabled: !venueId && venueSearch.length > 2 }
    );

  const { data: venue, isLoading: isLoadingVenue } = trpc.venue.getVenueById.useQuery(
    { id: venueId as string },
    { enabled: !!venueId }
  );

  useEffect(() => {
    if (venue) {
      setFormData((prev) => ({
        ...prev,
        venueName: venue.name,
        address: venue.address || "",
        city: venue.city,
        state: venue.state,
      }));
    }
  }, [venue]);

  if (venueId && isLoadingVenue) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const createVenueMutation = trpc.venue.createVenue.useMutation();

  const createMutation = trpc.event.createEvent.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      router.push(`/event/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.category ||
      !formData.startAt ||
      (!venueId && !selectedVenue && !isCreatingNewVenue) ||
      ((isCreatingNewVenue || (!venueId && !selectedVenue)) &&
        (!formData.venueName || !formData.city || !formData.state))
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startAt);
    const endDate = formData.endAt ? new Date(formData.endAt) : null;

    if (endDate && endDate <= startDate) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    let finalVenueId = venueId || selectedVenue?.id;

    // If creating a new venue, do that first
    if (isCreatingNewVenue) {
      try {
        const newVenue = await createVenueMutation.mutateAsync({
          name: formData.venueName,
          address: formData.address || undefined,
          city: formData.city,
          state: formData.state,
        });
        finalVenueId = newVenue.id;
      } catch (error: any) {
        toast({
          title: "Venue Creation Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    createMutation.mutate({
      venueId: finalVenueId,
      organizerId,
      title: formData.title,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      category: formData.category,
      startAt: startDate,
      endAt: endDate || undefined,
      venueName: formData.venueName,
      address: formData.address || undefined,
      city: formData.city,
      state: formData.state,
    });
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={venueId ? `/venue/${venueId}` : organizerId ? `/organizer/${organizerId}` : "/home"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Create Event
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to create a new event
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            Event Details
            {venue && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                at {venue.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <S3Uploader
                folder="events"
                currentImageUrl={formData.imageUrl}
                onUploadComplete={(url) =>
                  setFormData({ ...formData, imageUrl: url })
                }
                onRemoveImage={() =>
                  setFormData({ ...formData, imageUrl: "" })
                }
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Summer Music Festival"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your event..."
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as (typeof EVENT_CATEGORIES)[number],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startAt">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startAt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End Date & Time</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) =>
                    setFormData({ ...formData, endAt: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Venue Details - Hidden if venueId is provided */}
            {!venueId && (
              <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Venue</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingNewVenue(!isCreatingNewVenue);
                      setSelectedVenue(null);
                      if (!isCreatingNewVenue) {
                        setFormData({
                          ...formData,
                          venueName: "",
                          address: "",
                          city: "",
                          state: "",
                        });
                      }
                    }}
                  >
                    {isCreatingNewVenue ? "Select Existing" : "Add New Venue"}
                  </Button>
                </div>

                {!isCreatingNewVenue ? (
                  <div className="space-y-4">
                    <Popover
                      open={isVenuePopoverOpen}
                      onOpenChange={setIsVenuePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isVenuePopoverOpen}
                          className="w-full justify-between"
                        >
                          {selectedVenue
                            ? selectedVenue.name
                            : "Search for a venue..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <div className="flex flex-col">
                          <div className="flex items-center border-b px-3 py-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Type to search..."
                              value={venueSearch}
                              onChange={(e) => setVenueSearch(e.target.value)}
                            />
                          </div>
                          <div className="max-h-[300px] overflow-auto p-1">
                            {isSearchingVenues && (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                            {!isSearchingVenues &&
                              searchResults?.map((v: any) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                    setSelectedVenue(v);
                                    setFormData({
                                      ...formData,
                                      venueName: v.name,
                                      address: v.address || "",
                                      city: v.city,
                                      state: v.state,
                                    });
                                    setIsVenuePopoverOpen(false);
                                  }}
                                >
                                  <div className="font-medium">{v.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {v.city}, {v.state}
                                  </div>
                                </button>
                              ))}
                            {!isSearchingVenues &&
                              venueSearch.length > 2 &&
                              searchResults?.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  No venues found.
                                </div>
                              )}
                            {venueSearch.length <= 2 && (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Type at least 3 characters...
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {selectedVenue && (
                      <div className="rounded-md bg-background p-3 text-sm shadow-sm">
                        <div className="font-semibold text-primary">
                          {selectedVenue.name}
                        </div>
                        <div className="text-muted-foreground">
                          {selectedVenue.address && (
                            <div className="flex items-center gap-1">
                              {selectedVenue.address}
                            </div>
                          )}
                          <div>
                            {selectedVenue.city}, {selectedVenue.state}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Venue Name */}
                    <div className="space-y-2">
                      <Label htmlFor="venueName">Venue Name</Label>
                      <Input
                        id="venueName"
                        value={formData.venueName}
                        onChange={(e) =>
                          setFormData({ ...formData, venueName: e.target.value })
                        }
                        placeholder="The Grand Theater"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="123 Main St"
                      />
                    </div>

                    {/* City & State */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="San Francisco"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">
                          State <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) =>
                            setFormData({ ...formData, state: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Event
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <NewEventPageContent />
    </Suspense>
  );
}
