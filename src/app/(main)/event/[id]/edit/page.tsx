"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Calendar, Loader2, ImageIcon, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { US_STATES } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

const EVENT_CATEGORIES = [
  "music",
  "food",
  "art",
  "sports",
  "nightlife",
  "community",
  "other",
] as const;

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  // Fetch event data
  const { data: event, isLoading: eventLoading } = trpc.event.getEventById.useQuery({
    eventId,
  });

  // Check if user is admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

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

  const updateMutation = trpc.event.updateEvent.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      router.push(`/event/${eventId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        imageUrl: event.imageUrl || "",
        category: event.category as (typeof EVENT_CATEGORIES)[number],
        startAt: format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: event.endAt ? format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm") : "",
        venueName: event.venueName || "",
        address: event.address || "",
        city: event.city || "",
        state: event.state || "",
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.category ||
      !formData.startAt ||
      !formData.city ||
      !formData.state
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

    updateMutation.mutate({
      eventId,
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

  if (eventLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <p className="text-muted-foreground mb-4">
          The event you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/calendar">
          <Button>Back to Calendar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Link
        href={`/event/${eventId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <CardTitle className="text-2xl">Edit Event</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update event details
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              {formData.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={formData.imageUrl}
                    alt="Event image"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <UploadButton
                    endpoint="eventImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) {
                        setFormData({ ...formData, imageUrl: res[0].url });
                        toast({
                          title: "Upload Complete",
                          description: "Image uploaded successfully",
                        });
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast({
                        title: "Upload Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload an image for your event
                  </p>
                </div>
              )}
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
                placeholder="Enter event title"
                required
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
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder="Describe your event"
                rows={5}
              />
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
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

            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                value={formData.venueName}
                onChange={(e) =>
                  setFormData({ ...formData, venueName: e.target.value })
                }
                placeholder="Enter venue name"
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
                placeholder="Enter street address"
              />
            </div>

            {/* City & State */}
            <div className="grid gap-4 sm:grid-cols-2">
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
                  placeholder="Enter city"
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
                    <SelectValue placeholder="Select state" />
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

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update Event
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/event/${eventId}`)}
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
