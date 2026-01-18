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
import { Users, Loader2, X, Plus, ImageIcon as ImageIconLucide } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { S3Uploader } from "@/components/ui/s3-uploader";

export default function AdminOrganizersPage() {
    const { toast } = useToast();
    const utils = trpc.useUtils();

    // Organizer form state
    const [organizerForm, setOrganizerForm] = useState({
        slug: "",
        name: "",
        description: "",
        imageUrl: "",
        city: "",
        state: "",
        website: "",
        instagram: "",
    });

    // Edit mode state
    const [editingOrganizerId, setEditingOrganizerId] = useState<string | null>(null);

    // Member management state
    const [selectedOrganizer, setSelectedOrganizer] = useState<string>("");
    const [userSearch, setUserSearch] = useState("");

    // Fetch data
    const { data: organizers } = trpc.admin.listAllOrganizers.useQuery({});

    const { data: organizerMembers } = trpc.organizer.getOrganizerMembers.useQuery(
        { organizerId: selectedOrganizer },
        { enabled: !!selectedOrganizer }
    );

    const { data: searchedUsers } = trpc.admin.searchUsers.useQuery(
        { query: userSearch },
        { enabled: userSearch.length >= 2 }
    );

    // Mutations
    const clearForm = () => {
        setOrganizerForm({
            slug: "",
            name: "",
            description: "",
            imageUrl: "",
            city: "",
            state: "",
            website: "",
            instagram: "",
        });
        setEditingOrganizerId(null);
    };

    const createOrganizerMutation = trpc.admin.createOrganizer.useMutation({
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Organizer created successfully",
            });
            clearForm();
            utils.admin.listAllOrganizers.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateOrganizerMutation = trpc.organizer.updateOrganizer.useMutation({
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Organizer updated successfully",
            });
            clearForm();
            utils.admin.listAllOrganizers.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleEdit = (organizer: any) => {
        setEditingOrganizerId(organizer.id);
        setOrganizerForm({
            slug: organizer.slug,
            name: organizer.name,
            description: organizer.description || "",
            imageUrl: organizer.imageUrl || "",
            city: organizer.city || "",
            state: organizer.state || "",
            website: organizer.website || "",
            instagram: organizer.instagram || "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const addOrganizerMemberMutation = trpc.admin.addOrganizerMember.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Member added to organizer" });
            utils.organizer.getOrganizerMembers.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const removeOrganizerMemberMutation =
        trpc.admin.removeOrganizerMember.useMutation({
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Member removed from organizer",
                });
                utils.organizer.getOrganizerMembers.invalidate();
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
                <h1 className="text-3xl font-bold tracking-tight">Organizer Management</h1>
                <p className="text-muted-foreground">
                    Create and manage event organizers and their members
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {editingOrganizerId ? "Edit Organizer" : "Create Organizer"}
                            </CardTitle>
                            <CardDescription>
                                {editingOrganizerId
                                    ? "Update organizer information"
                                    : "Add a new event organizer to the platform"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="organizer-slug">Slug *</Label>
                                    <Input
                                        id="organizer-slug"
                                        placeholder="after-brunch"
                                        value={organizerForm.slug}
                                        onChange={(e) =>
                                            setOrganizerForm({ ...organizerForm, slug: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="organizer-name">Name *</Label>
                                    <Input
                                        id="organizer-name"
                                        placeholder="After Brunch"
                                        value={organizerForm.name}
                                        onChange={(e) =>
                                            setOrganizerForm({ ...organizerForm, name: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Organizer Image</Label>
                                <S3Uploader
                                    folder="organizers"
                                    currentImageUrl={organizerForm.imageUrl}
                                    onUploadComplete={(url) =>
                                        setOrganizerForm({ ...organizerForm, imageUrl: url })
                                    }
                                    onRemoveImage={() =>
                                        setOrganizerForm({ ...organizerForm, imageUrl: "" })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="organizer-description">Description</Label>
                                <Textarea
                                    id="organizer-description"
                                    placeholder="Boston's premier social events..."
                                    value={organizerForm.description}
                                    onChange={(e) =>
                                        setOrganizerForm({
                                            ...organizerForm,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="organizer-city">City (Optional)</Label>
                                    <Input
                                        id="organizer-city"
                                        placeholder="Boston"
                                        value={organizerForm.city}
                                        onChange={(e) =>
                                            setOrganizerForm({ ...organizerForm, city: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="organizer-state">State (Optional)</Label>
                                    <Input
                                        id="organizer-state"
                                        placeholder="MA"
                                        maxLength={2}
                                        value={organizerForm.state}
                                        onChange={(e) =>
                                            setOrganizerForm({
                                                ...organizerForm,
                                                state: e.target.value.toUpperCase(),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="organizer-website">Website</Label>
                                    <Input
                                        id="organizer-website"
                                        placeholder="https://example.com"
                                        value={organizerForm.website}
                                        onChange={(e) =>
                                            setOrganizerForm({
                                                ...organizerForm,
                                                website: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="organizer-instagram">Instagram</Label>
                                    <Input
                                        id="organizer-instagram"
                                        placeholder="afterbrunch"
                                        value={organizerForm.instagram}
                                        onChange={(e) =>
                                            setOrganizerForm({
                                                ...organizerForm,
                                                instagram: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editingOrganizerId ? (
                                    <>
                                        <Button
                                            className="flex-1"
                                            onClick={() =>
                                                updateOrganizerMutation.mutate({
                                                    organizerId: editingOrganizerId,
                                                    ...organizerForm,
                                                })
                                            }
                                            disabled={
                                                updateOrganizerMutation.isPending ||
                                                !organizerForm.slug ||
                                                !organizerForm.name
                                            }
                                        >
                                            {updateOrganizerMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Update Organizer
                                        </Button>
                                        <Button variant="outline" onClick={clearForm}>
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="flex-1"
                                        onClick={() => createOrganizerMutation.mutate(organizerForm)}
                                        disabled={
                                            createOrganizerMutation.isPending ||
                                            !organizerForm.slug ||
                                            !organizerForm.name
                                        }
                                    >
                                        {createOrganizerMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Create Organizer
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Organizer Members</CardTitle>
                            <CardDescription>
                                Add or remove members from organizers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="select-organizer">Select Organizer</Label>
                                <Select
                                    value={selectedOrganizer}
                                    onValueChange={setSelectedOrganizer}
                                >
                                    <SelectTrigger id="select-organizer">
                                        <SelectValue placeholder="Choose an organizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizers?.map((organizer) => (
                                            <SelectItem key={organizer.id} value={organizer.id}>
                                                {organizer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedOrganizer && (
                                <>
                                    <div>
                                        <Label>Current Members</Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {organizerMembers?.map((member) => (
                                                <Badge
                                                    key={member.id}
                                                    variant="secondary"
                                                    className="flex items-center gap-2"
                                                >
                                                    {member.user.username || member.user.email}
                                                    <button
                                                        onClick={() =>
                                                            removeOrganizerMemberMutation.mutate({
                                                                organizerId: selectedOrganizer,
                                                                userId: member.userId,
                                                            })
                                                        }
                                                        className="hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            {!organizerMembers?.length && (
                                                <p className="text-sm text-muted-foreground">
                                                    No members yet
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="organizer-user-search">Add Member</Label>
                                        <Input
                                            id="organizer-user-search"
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
                                                                addOrganizerMemberMutation.mutate({
                                                                    organizerId: selectedOrganizer,
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
                            <CardTitle>Existing Organizers</CardTitle>
                            <CardDescription>
                                List of all event organizers on the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {organizers?.map((organizer) => (
                                    <div
                                        key={organizer.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            {organizer.imageUrl ? (
                                                <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                                                    <img
                                                        src={organizer.imageUrl}
                                                        alt={organizer.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                                                    <Users className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{organizer.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {organizer.city || "No City"},{" "}
                                                    {organizer.state || "No State"}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(organizer)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                ))}
                                {!organizers?.length && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        No organizers found
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
