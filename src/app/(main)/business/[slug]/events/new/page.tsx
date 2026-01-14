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
import { Calendar, Loader2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { US_STATES } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

const EVENT_CATEGORIES = [
  "music",
  "food",
  "art",
  "sports",
  "nightlife",
  "community",
  "other",
] as const;

export default function NewEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();

  // Fetch business to verify ownership
  const { data: business, isLoading: businessLoading } =
    trpc.business.getBusinessBySlug.useQuery({ slug });

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

  // Populate form with business defaults when business loads
  useEffect(() => {
    if (business) {
      setFormData((prev) => ({
        ...prev,
        address: (business as any).address || "",
        city: business.city,
        state: business.state,
      }));
    }
  }, [business]);

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

    createMutation.mutate({
      businessId: business?.id,
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
      visibility: "public",
    });
  };

  if (businessLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <CardTitle className="text-2xl">Create New Event</CardTitle>
              {business && (
                <p className="text-sm text-muted-foreground">
                  For {business.name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
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
                placeholder="Summer Concert Series"
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
                onValueChange={(value: (typeof EVENT_CATEGORIES)[number]) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="nightlife">Nightlife</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                placeholder="Tell people about your event..."
                rows={4}
              />
            </div>

            {/* Event Image */}
            <div className="space-y-2">
              <Label>Event Image</Label>
              {formData.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
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
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Upload an image for your event
                    </p>
                    <UploadButton
                      endpoint="eventImage"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setFormData({ ...formData, imageUrl: res[0].url });
                          toast({
                            title: "Success",
                            description: "Image uploaded successfully",
                          });
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          title: "Upload failed",
                          description: error.message,
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
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
                placeholder="Main Stage (optional)"
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
                placeholder="123 Main Street"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
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
                  <SelectTrigger id="state">
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
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
