"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { S3Uploader } from "@/components/ui/s3-uploader";
import { VenueSelector, VenueData } from "@/components/events/venue-selector";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface EventFormProps {
  venueId?: string;
  organizerId?: string;
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
}

export function EventForm({
  venueId,
  organizerId,
  onSuccess,
  onCancel,
}: EventFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    categories: [] as string[],
    startAt: "",
    endAt: "",
    venueName: "",
    address: "",
    city: "",
    state: "",
  });

  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [isCreatingNewVenue, setIsCreatingNewVenue] = useState(false);

  const { data: venue, isLoading: isLoadingVenue } =
    trpc.place.getPlaceById.useQuery(
      { id: venueId as string },
      { enabled: !!venueId }
    );

  useEffect(() => {
    if (venue) {
      setSelectedVenue({
        id: venue.id,
        name: venue.name,
        address: venue.address || "",
        city: venue.city || "",
        state: venue.state || "",
        categories: (venue.categories as string[]) || [],
      });
      // Inherit venue categories
      if ((venue.categories as string[])?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categories: venue.categories as string[],
        }));
      }
    }
  }, [venue]);

  const createVenueMutation = trpc.place.createPlace.useMutation();

  const createMutation = trpc.event.createEvent.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      onSuccess?.(data.id);
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

    if (!formData.title || !formData.startAt) {
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
    if (isCreatingNewVenue && selectedVenue) {
      try {
        const newVenue = await createVenueMutation.mutateAsync({
          type: "venue",
          name: selectedVenue.name,
          address: selectedVenue.address || undefined,
          city: selectedVenue.city,
          state: selectedVenue.state,
          latitude: selectedVenue.latitude,
          longitude: selectedVenue.longitude,
          instagram: selectedVenue.instagram || undefined,
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

    if (!finalVenueId && !isCreatingNewVenue) {
      toast({
        title: "Validation Error",
        description: "Please select a venue",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      venueId: finalVenueId,
      organizerId,
      title: formData.title,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      categories: formData.categories,
      startAt: startDate,
      endAt: endDate || undefined,
      venueName: selectedVenue?.name || formData.venueName,
      address: selectedVenue?.address || formData.address || undefined,
      city: selectedVenue?.city || formData.city,
      state: selectedVenue?.state || formData.state,
    });
  };

  // When a venue is selected, inherit its categories
  const handleVenueSelect = (venue: VenueData | null) => {
    setSelectedVenue(venue);
    if (venue?.categories && venue.categories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        categories: venue.categories || [],
      }));
    }
  };

  if (venueId && isLoadingVenue) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Venue Details - Hidden if venueId is provided */}
      {!venueId && (
        <VenueSelector
          selectedVenue={selectedVenue}
          onVenueSelect={handleVenueSelect}
          isCreatingNew={isCreatingNewVenue}
          setIsCreatingNew={setIsCreatingNewVenue}
        />
      )}

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
                onUploadComplete={(url: string) =>
                  setFormData({ ...formData, imageUrl: url })
                }
                onRemoveImage={() => setFormData({ ...formData, imageUrl: "" })}
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

            {/* Categories */}
            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <CategoryMultiSelect
                value={formData.categories}
                onChange={(categories) =>
                  setFormData({ ...formData, categories })
                }
                placeholder="Select categories..."
              />
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <DateTimePicker
                  value={formData.startAt}
                  onChange={(value) =>
                    setFormData({ ...formData, startAt: value })
                  }
                  placeholder="Select start date & time"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <DateTimePicker
                  value={formData.endAt}
                  onChange={(value) =>
                    setFormData({ ...formData, endAt: value })
                  }
                  placeholder="Select end date & time"
                />
              </div>
            </div>

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
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
