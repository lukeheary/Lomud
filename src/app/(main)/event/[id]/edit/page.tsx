"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { S3Uploader } from "@/components/ui/s3-uploader";
import Link from "next/link";
import { format } from "date-fns";
import { VenueSelector, VenueData } from "@/components/events/venue-selector";
import { CategoryMultiSelect } from "@/components/category-multi-select";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  // Fetch event data
  const { data: event, isLoading: eventLoading } =
    trpc.event.getEventById.useQuery({
      eventId,
    });

  // Check if user is admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

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

  const createVenueMutation = trpc.venue.createVenue.useMutation();

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
        categories: (event.categories as string[]) || [],
        startAt: format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: event.endAt
          ? format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm")
          : "",
        venueName: event.venueName || "",
        address: event.address || "",
        city: event.city || "",
        state: event.state || "",
      });
      setSelectedVenue({
        id: event.venueId || undefined,
        name: event.venueName || "",
        address: event.address || "",
        city: event.city || "",
        state: event.state || "",
      });
      // If no venue ID, it was a manual entry, so we show it as "creating new" mode
      if (!event.venueId) {
        setIsCreatingNewVenue(true);
      }
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
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

    const performUpdate = async () => {
      let finalVenueId = selectedVenue?.id;

      if (isCreatingNewVenue && selectedVenue) {
        try {
          const newVenue = await createVenueMutation.mutateAsync({
            name: selectedVenue.name,
            address: selectedVenue.address || undefined,
            city: selectedVenue.city,
            state: selectedVenue.state,
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

      updateMutation.mutate({
        eventId,
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
        venueId: finalVenueId,
      });
    };

    performUpdate();
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
        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Event not found</h2>
        <p className="mb-4 text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Link
        href={`/event/${eventId}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
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
              <S3Uploader
                folder={`events/${eventId}`}
                fileName="cover.png"
                currentImageUrl={formData.imageUrl}
                onUploadComplete={(url) =>
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
                placeholder="Enter event title"
                required
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

            {/* Venue Details */}
            <VenueSelector
              selectedVenue={selectedVenue}
              onVenueSelect={setSelectedVenue}
              isCreatingNew={isCreatingNewVenue}
              setIsCreatingNew={setIsCreatingNewVenue}
            />

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/event/${eventId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
