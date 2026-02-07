"use client";

import { useState, useEffect, useRef } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { addDays } from "date-fns";
import type { VenueHours } from "@/components/venue-hours-editor";

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
    coverImageUrl: "",
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
  const lastAutoAppliedKeyRef = useRef<string | null>(null);

  const getDatePart = (value: string) => (value ? value.split("T")[0] : "");
  const getTimePart = (value: string) => (value ? value.split("T")[1] : "");
  const buildDateTime = (date: string, time: string) =>
    date ? `${date}T${time}` : "";

  const getVenueDayHours = (
    dateString: string,
    hours?: VenueHours | null
  ) => {
    if (!dateString || !hours) return null;
    const dayIndex = new Date(`${dateString}T00:00`).getDay();
    const dayKeys: (keyof VenueHours)[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayKey = dayKeys[dayIndex];
    const dayHours = hours[dayKey];
    if (!dayHours || dayHours.closed) return null;
    return dayHours;
  };

  const applyVenueHoursToDate = (
    dateString: string,
    hours?: VenueHours | null,
    venueKeyOverride?: string
  ) => {
    const dayHours = getVenueDayHours(dateString, hours);
    if (!dayHours) return;

    const venueKey =
      venueKeyOverride || selectedVenue?.id || selectedVenue?.name || "unknown";
    const autoKey = `${venueKey}:${dateString}`;
    if (lastAutoAppliedKeyRef.current === autoKey) return;

    const startHour = parseInt(dayHours.open.split(":")[0] || "0", 10);
    const startMinute = parseInt(dayHours.open.split(":")[1] || "0", 10);
    const endHour = parseInt(dayHours.close.split(":")[0] || "0", 10);
    const endMinute = parseInt(dayHours.close.split(":")[1] || "0", 10);
    const isOvernight =
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute);

    const endDateString = isOvernight
      ? addDays(new Date(`${dateString}T00:00`), 1)
          .toISOString()
          .slice(0, 10)
      : dateString;

    setFormData((prev) => {
      return {
        ...prev,
        startAt: buildDateTime(dateString, dayHours.open),
        endAt: buildDateTime(endDateString, dayHours.close),
      };
    });

    lastAutoAppliedKeyRef.current = autoKey;
  };

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
        hours: (venue.hours as VenueHours) || null,
      });
      // Inherit venue categories
      if ((venue.categories as string[])?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categories: venue.categories as string[],
        }));
      }
      const startDate = getDatePart(formData.startAt);
      if (startDate) {
        applyVenueHoursToDate(
          startDate,
          venue.hours as VenueHours,
          venue.id
        );
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
      coverImageUrl: formData.coverImageUrl || undefined,
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
    const startDate = getDatePart(formData.startAt);
    if (startDate) {
      applyVenueHoursToDate(
        startDate,
        venue?.hours || null,
        venue?.id || venue?.name
      );
    }
  };

  const handleStartDateChange = (date: string) => {
    if (!date) {
      setFormData((prev) => ({ ...prev, startAt: "" }));
      return;
    }

    const venueHours = selectedVenue?.hours || (venue?.hours as VenueHours);
    const dayHours = getVenueDayHours(date, venueHours);

    if (dayHours) {
      applyVenueHoursToDate(date, venueHours);
      return;
    }

    setFormData((prev) => {
      const startTime = getTimePart(prev.startAt) || "19:00";
      const nextStartAt = buildDateTime(date, startTime);
      const endDate = getDatePart(prev.endAt);
      const endTime = getTimePart(prev.endAt);
      const nextEndAt = endDate
        ? buildDateTime(date, endTime || "23:00")
        : prev.endAt;
      return {
        ...prev,
        startAt: nextStartAt,
        endAt: nextEndAt,
      };
    });
  };

  const handleStartTimeChange = (time: string) => {
    const date = getDatePart(formData.startAt);
    if (!date) return;
    setFormData((prev) => ({
      ...prev,
      startAt: buildDateTime(date, time || "00:00"),
    }));
  };

  const handleEndDateChange = (date: string) => {
    if (!date) {
      setFormData((prev) => ({ ...prev, endAt: "" }));
      return;
    }
    setFormData((prev) => {
      const time =
        getTimePart(prev.endAt) ||
        getTimePart(prev.startAt) ||
        "23:00";
      return {
        ...prev,
        endAt: buildDateTime(date, time),
      };
    });
  };

  const handleEndTimeChange = (time: string) => {
    const date = getDatePart(formData.endAt);
    if (!date) return;
    setFormData((prev) => ({
      ...prev,
      endAt: buildDateTime(date, time || "00:00"),
    }));
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
                fileName="coverImage.png"
                currentImageUrl={formData.coverImageUrl}
                onUploadComplete={(url: string) =>
                  setFormData({ ...formData, coverImageUrl: url })
                }
                onRemoveImage={() =>
                  setFormData({ ...formData, coverImageUrl: "" })
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={getDatePart(formData.startAt)}
                  onChange={handleStartDateChange}
                  placeholder="Select start date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="time"
                  value={getTimePart(formData.startAt)}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  disabled={!getDatePart(formData.startAt)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  value={getDatePart(formData.endAt)}
                  onChange={handleEndDateChange}
                  placeholder="Select end date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={getTimePart(formData.endAt)}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  disabled={!getDatePart(formData.endAt)}
                  className="h-12"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
