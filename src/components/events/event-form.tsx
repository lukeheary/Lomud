"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { S3Uploader } from "@/components/ui/s3-uploader";
import { VenueSelector, VenueData } from "@/components/events/venue-selector";

const EVENT_CATEGORIES = [
    "clubs",
    "bars",
    "concerts",
    "comedy",
    "theater",
    "social",
] as const;

interface EventFormProps {
    venueId?: string;
    organizerId?: string;
    onSuccess?: (eventId: string) => void;
    onCancel?: () => void;
}

export function EventForm({ venueId, organizerId, onSuccess, onCancel }: EventFormProps) {
    const { toast } = useToast();

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

    const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
    const [isCreatingNewVenue, setIsCreatingNewVenue] = useState(false);

    const { data: venue, isLoading: isLoadingVenue } = trpc.venue.getVenueById.useQuery(
        { id: venueId as string },
        { enabled: !!venueId }
    );

    useEffect(() => {
        if (venue) {
            setSelectedVenue({
                id: venue.id,
                name: venue.name,
                address: venue.address || "",
                city: venue.city,
                state: venue.state,
            });
        }
    }, [venue]);

    const createVenueMutation = trpc.venue.createVenue.useMutation();

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

        if (
            !formData.title ||
            !formData.category ||
            !formData.startAt
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

        createMutation.mutate({
            venueId: finalVenueId,
            organizerId,
            title: formData.title,
            description: formData.description || undefined,
            imageUrl: formData.imageUrl || undefined,
            category: formData.category,
            startAt: startDate,
            endAt: endDate || undefined,
            venueName: selectedVenue?.name || formData.venueName,
            address: selectedVenue?.address || formData.address || undefined,
            city: selectedVenue?.city || formData.city,
            state: selectedVenue?.state || formData.state,
        });
    };

    if (venueId && isLoadingVenue) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
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
                        <VenueSelector
                            selectedVenue={selectedVenue}
                            onVenueSelect={setSelectedVenue}
                            isCreatingNew={isCreatingNewVenue}
                            setIsCreatingNew={setIsCreatingNewVenue}
                        />
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
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
