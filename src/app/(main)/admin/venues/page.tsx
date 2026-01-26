"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, X, Plus, ArrowLeft, Users as UsersIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { S3Uploader } from "@/components/ui/s3-uploader";
import { VenueHoursEditor, type VenueHours } from "@/components/venue-hours-editor";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";

type ViewMode = "list" | "create" | "edit" | "members";

export default function AdminVenuesPage() {
    const { toast } = useToast();
    const utils = trpc.useUtils();

    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchQuery, setSearchQuery] = useState("");

    // Venue form state
    const [venueForm, setVenueForm] = useState({
        slug: "",
        name: "",
        description: "",
        imageUrl: "",
        address: "",
        city: "",
        state: "",
        website: "",
        instagram: "",
        hours: null as VenueHours | null,
    });

    // Google Places search state
    const [placeSearch, setPlaceSearch] = useState("");

    // Edit mode state
    const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

    // Member management state
    const [selectedVenue, setSelectedVenue] = useState<string>("");
    const [userSearch, setUserSearch] = useState("");

    // Fetch data
    const { data: venues } = trpc.admin.listAllVenues.useQuery({});

    const { data: venueMembers } = trpc.venue.getVenueMembers.useQuery(
        { venueId: selectedVenue },
        { enabled: !!selectedVenue }
    );

    const { data: searchedUsers } = trpc.admin.searchUsers.useQuery(
        { query: userSearch },
        { enabled: userSearch.length >= 2 }
    );

    // Mutations
    const clearForm = () => {
        setVenueForm({
            slug: "",
            name: "",
            description: "",
            imageUrl: "",
            address: "",
            city: "",
            state: "",
            website: "",
            instagram: "",
            hours: null,
        });
        setEditingVenueId(null);
        setPlaceSearch("");
    };

    const handlePlaceSelect = useCallback((place: {
        name: string;
        address: string;
        city: string;
        state: string;
        formattedAddress: string;
    }) => {
        // Generate slug from venue name
        const slug = place.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        setVenueForm(prev => ({
            ...prev,
            slug: slug.length >= 3 ? slug : `venue-${slug}`,
            name: place.name,
            address: place.address,
            city: place.city,
            state: place.state,
        }));
        setPlaceSearch(place.name);
    }, []);

    const createVenueMutation = trpc.admin.createVenue.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Venue created successfully" });
            clearForm();
            setViewMode("list");
            utils.admin.listAllVenues.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateVenueMutation = trpc.venue.updateVenue.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Venue updated successfully" });
            clearForm();
            setViewMode("list");
            utils.admin.listAllVenues.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleEdit = (venue: any) => {
        setEditingVenueId(venue.id);
        setVenueForm({
            slug: venue.slug,
            name: venue.name,
            description: venue.description || "",
            imageUrl: venue.imageUrl || "",
            address: venue.address || "",
            city: venue.city,
            state: venue.state,
            website: venue.website || "",
            instagram: venue.instagram || "",
            hours: venue.hours || null,
        });
        setPlaceSearch(venue.name);
        setViewMode("edit");
    };

    const handleBack = () => {
        clearForm();
        setViewMode("list");
        setSelectedVenue("");
    };

    const handleManageMembers = (venueId: string) => {
        setSelectedVenue(venueId);
        setViewMode("members");
    };

    const addVenueMemberMutation = trpc.admin.addVenueMember.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Member added to venue" });
            utils.venue.getVenueMembers.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const removeVenueMemberMutation = trpc.admin.removeVenueMember.useMutation({
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Member removed from venue",
            });
            utils.venue.getVenueMembers.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Filter venues by search query
    const filteredVenues = venues?.filter((venue) =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // List View
    if (viewMode === "list") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Venue Management</h1>
                        <p className="text-muted-foreground">
                            Create and manage venues
                        </p>
                    </div>
                    <Button onClick={() => setViewMode("create")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Venue
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="space-y-3">
                    {filteredVenues?.map((venue) => (
                        <Card key={venue.id}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    {venue.imageUrl ? (
                                        <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                                            <img
                                                src={venue.imageUrl}
                                                alt={venue.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                                            <Building2 className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium">{venue.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {venue.city}, {venue.state}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleManageMembers(venue.id)}
                                    >
                                        <UsersIcon className="mr-2 h-4 w-4" />
                                        Members
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(venue)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {!filteredVenues?.length && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No venues found
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Create/Edit View
    if (viewMode === "create" || viewMode === "edit") {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {viewMode === "edit" ? "Edit Venue" : "Create Venue"}
                        </h1>
                        <p className="text-muted-foreground">
                            {viewMode === "edit"
                                ? "Update venue information"
                                : "Add a new venue to the platform"}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div>
                            <Label htmlFor="venue-search">Search Venue *</Label>
                            <GooglePlacesAutocomplete
                                value={placeSearch}
                                onChange={setPlaceSearch}
                                onPlaceSelect={handlePlaceSelect}
                                placeholder="Search for a venue (e.g. Big Night Live Boston)..."
                                searchType="establishment"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Start typing the venue name to auto-fill details
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="venue-slug">Slug *</Label>
                                <Input
                                    id="venue-slug"
                                    placeholder="big-night-live"
                                    value={venueForm.slug}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, slug: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="venue-name">Name *</Label>
                                <Input
                                    id="venue-name"
                                    placeholder="Big Night Live"
                                    value={venueForm.name}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, name: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Venue Image</Label>
                            <S3Uploader
                                folder="venues"
                                currentImageUrl={venueForm.imageUrl}
                                onUploadComplete={(url) =>
                                    setVenueForm({ ...venueForm, imageUrl: url })
                                }
                                onRemoveImage={() =>
                                    setVenueForm({ ...venueForm, imageUrl: "" })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="venue-description">Description</Label>
                            <Textarea
                                id="venue-description"
                                placeholder="Boston's premier concert venue..."
                                value={venueForm.description}
                                onChange={(e) =>
                                    setVenueForm({
                                        ...venueForm,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="venue-address">Address</Label>
                            <Input
                                id="venue-address"
                                placeholder="110 Causeway St"
                                value={venueForm.address}
                                onChange={(e) =>
                                    setVenueForm({ ...venueForm, address: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="venue-city">City *</Label>
                                <Input
                                    id="venue-city"
                                    placeholder="Boston"
                                    value={venueForm.city}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, city: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="venue-state">State *</Label>
                                <Input
                                    id="venue-state"
                                    placeholder="MA"
                                    maxLength={2}
                                    value={venueForm.state}
                                    onChange={(e) =>
                                        setVenueForm({
                                            ...venueForm,
                                            state: e.target.value.toUpperCase(),
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="venue-website">Website</Label>
                                <Input
                                    id="venue-website"
                                    placeholder="https://bignightlive.com"
                                    value={venueForm.website}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, website: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="venue-instagram">Instagram</Label>
                                <Input
                                    id="venue-instagram"
                                    placeholder="bignightlive"
                                    value={venueForm.instagram}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, instagram: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <VenueHoursEditor
                            hours={venueForm.hours}
                            onChange={(hours) => setVenueForm({ ...venueForm, hours })}
                        />
                        <div className="flex gap-2">
                            {viewMode === "edit" ? (
                                <Button
                                    onClick={() =>
                                        updateVenueMutation.mutate({
                                            venueId: editingVenueId!,
                                            ...venueForm,
                                        })
                                    }
                                    disabled={
                                        updateVenueMutation.isPending ||
                                        !venueForm.slug ||
                                        !venueForm.name ||
                                        !venueForm.city ||
                                        !venueForm.state
                                    }
                                >
                                    {updateVenueMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Update Venue
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => createVenueMutation.mutate(venueForm)}
                                    disabled={
                                        createVenueMutation.isPending ||
                                        !venueForm.slug ||
                                        !venueForm.name ||
                                        !venueForm.city ||
                                        !venueForm.state
                                    }
                                >
                                    {createVenueMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Venue
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleBack}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Members View
    if (viewMode === "members") {
        const currentVenue = venues?.find((v) => v.id === selectedVenue);

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Manage Members
                        </h1>
                        <p className="text-muted-foreground">
                            {currentVenue?.name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Members</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {venueMembers?.map((member) => (
                                <Badge
                                    key={member.id}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    {member.user.username || member.user.email}
                                    <button
                                        onClick={() =>
                                            removeVenueMemberMutation.mutate({
                                                venueId: selectedVenue,
                                                userId: member.userId,
                                            })
                                        }
                                        className="hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {!venueMembers?.length && (
                                <p className="text-sm text-muted-foreground">
                                    No members yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add Member</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Search users by username or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                        {searchedUsers && searchedUsers.length > 0 && (
                            <div className="divide-y rounded-md border">
                                {searchedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3"
                                    >
                                        <span className="text-sm">
                                            {user.username || user.email}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                addVenueMemberMutation.mutate({
                                                    venueId: selectedVenue,
                                                    userId: user.id,
                                                });
                                                setUserSearch("");
                                            }}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
