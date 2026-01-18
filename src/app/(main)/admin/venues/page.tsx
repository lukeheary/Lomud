"use client";

import { useState } from "react";
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
import { Building2, Loader2, X, Plus, ImageIcon as ImageIconLucide } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { S3Uploader } from "@/components/ui/s3-uploader";

export default function AdminVenuesPage() {
    const { toast } = useToast();
    const utils = trpc.useUtils();

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
    });

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
        });
        setEditingVenueId(null);
    };

    const createVenueMutation = trpc.admin.createVenue.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Venue created successfully" });
            clearForm();
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
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
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
            toast({ title: "Success", description: "Member removed from venue" });
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Venue Management</h1>
                <p className="text-muted-foreground">
                    Create and manage venues and their members
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {editingVenueId ? "Edit Venue" : "Create Venue"}
                            </CardTitle>
                            <CardDescription>
                                {editingVenueId
                                    ? "Update venue information"
                                    : "Add a new venue to the platform"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    placeholder="A premier entertainment venue..."
                                    value={venueForm.description}
                                    onChange={(e) =>
                                        setVenueForm({ ...venueForm, description: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="grid grid-cols-2 gap-2">
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="venue-website">Website</Label>
                                    <Input
                                        id="venue-website"
                                        placeholder="https://example.com"
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
                            <div className="flex gap-2">
                                {editingVenueId ? (
                                    <>
                                        <Button
                                            className="flex-1"
                                            onClick={() =>
                                                updateVenueMutation.mutate({
                                                    venueId: editingVenueId,
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
                                        <Button variant="outline" onClick={clearForm}>
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="flex-1"
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
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Venue Members</CardTitle>
                            <CardDescription>Add or remove members from venues</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="select-venue">Select Venue</Label>
                                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                                    <SelectTrigger id="select-venue">
                                        <SelectValue placeholder="Choose a venue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {venues?.map((venue) => (
                                            <SelectItem key={venue.id} value={venue.id}>
                                                {venue.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedVenue && (
                                <>
                                    <div>
                                        <Label>Current Members</Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
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
                                    </div>

                                    <div>
                                        <Label htmlFor="user-search">Add Member</Label>
                                        <Input
                                            id="user-search"
                                            placeholder="Search users by username or email..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                        {searchedUsers && searchedUsers.length > 0 && (
                                            <div className="mt-2 divide-y rounded-md border">
                                                {searchedUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between p-2"
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
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Venues</CardTitle>
                            <CardDescription>
                                List of all venues on the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {venues?.map((venue) => (
                                    <div
                                        key={venue.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(venue)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                ))}
                                {!venues?.length && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        No venues found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
