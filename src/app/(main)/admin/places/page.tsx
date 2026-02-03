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
import {
  Building,
  Building2,
  Loader2,
  X,
  Plus,
  ArrowLeft,
  Users as UsersIcon,
  Search,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { S3Uploader } from "@/components/ui/s3-uploader";
import {
  VenueHoursEditor,
  type VenueHours,
} from "@/components/venue-hours-editor";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import Link from "next/link";
import { EventForm } from "@/components/events/event-form";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { SlugInstagramInput } from "@/components/slug-instagram-input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ViewMode = "list" | "create" | "edit" | "members" | "create-event";
type PlaceType = "venue" | "organizer";

export default function AdminPlacesPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PlaceType>("venue");

  // Place form state
  const [placeForm, setPlaceForm] = useState({
    type: "venue" as PlaceType,
    slug: "",
    name: "",
    description: "",
    imageUrl: "",
    address: "",
    city: "",
    state: "",
    website: "",
    instagram: "",
    latitude: null as number | null,
    longitude: null as number | null,
    hours: null as VenueHours | null,
    categories: [] as string[],
  });

  // Google Places search state
  const [placeSearch, setPlaceSearch] = useState("");

  // Edit mode state
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  // Member management state
  const [selectedPlace, setSelectedPlace] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [isSlugSynced, setIsSlugSynced] = useState(true);

  // Fetch data
  const { data: places } = trpc.admin.listAllPlaces.useQuery({ type: activeTab });

  const { data: placeMembers } = trpc.place.getPlaceMembers.useQuery(
    { placeId: selectedPlace },
    { enabled: !!selectedPlace }
  );

  const { data: searchedUsers } = trpc.admin.searchUsers.useQuery(
    { query: userSearch },
    { enabled: userSearch.length >= 2 }
  );

  // Mutations
  const clearForm = () => {
    setPlaceForm({
      type: activeTab,
      slug: "",
      name: "",
      description: "",
      imageUrl: "",
      address: "",
      city: "",
      state: "",
      website: "",
      instagram: "",
      latitude: null,
      longitude: null,
      hours: null,
      categories: [],
    });
    setEditingPlaceId(null);
    setPlaceSearch("");
    setIsSlugSynced(true);
  };

  const handlePlaceSelect = useCallback(
    (place: {
      name: string;
      address: string;
      city: string;
      state: string;
      formattedAddress: string;
      latitude?: number;
      longitude?: number;
    }) => {
      // Generate slug from place name
      const slug = place.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      setPlaceForm((prev) => ({
        ...prev,
        slug: slug.length >= 3 ? slug : `${prev.type}-${slug}`,
        name: place.name,
        address: place.address,
        city: place.city,
        state: place.state,
        latitude: place.latitude || null,
        longitude: place.longitude || null,
        instagram: isSlugSynced
          ? (slug.length >= 3 ? slug : `${prev.type}-${slug}`).replace(/-/g, "")
          : prev.instagram,
      }));
      setPlaceSearch(place.name);
    },
    [isSlugSynced]
  );

  const handleCitySelect = useCallback(
    (place: {
      name: string;
      address: string;
      city: string;
      state: string;
      formattedAddress: string;
    }) => {
      setPlaceForm((prev) => ({
        ...prev,
        city: place.city,
        state: place.state,
      }));
      setPlaceSearch(place.city);
    },
    []
  );

  const createPlaceMutation = trpc.admin.createPlace.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: `${placeForm.type === "venue" ? "Venue" : "Organizer"} created successfully` });
      clearForm();
      setViewMode("list");
      utils.admin.listAllPlaces.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlaceMutation = trpc.place.updatePlace.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: `${placeForm.type === "venue" ? "Venue" : "Organizer"} updated successfully` });
      clearForm();
      setViewMode("list");
      utils.admin.listAllPlaces.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (place: any) => {
    setEditingPlaceId(place.id);
    setPlaceForm({
      type: place.type,
      slug: place.slug,
      name: place.name,
      description: place.description || "",
      imageUrl: place.imageUrl || "",
      address: place.address || "",
      city: place.city || "",
      state: place.state || "",
      website: place.website || "",
      instagram: place.instagram || "",
      latitude: place.latitude || null,
      longitude: place.longitude || null,
      hours: place.hours || null,
      categories: (place.categories as string[]) || [],
    });
    setIsSlugSynced((place.slug || "") === (place.instagram || ""));
    setPlaceSearch(place.name);
    setViewMode("edit");
  };

  const handleBack = () => {
    clearForm();
    setViewMode("list");
    setSelectedPlace("");
  };

  const handleManageMembers = (placeId: string) => {
    setSelectedPlace(placeId);
    setViewMode("members");
  };

  const handleCreateEvent = (placeId: string) => {
    setSelectedPlace(placeId);
    setViewMode("create-event");
  };

  const handleCreate = () => {
    setPlaceForm((prev) => ({ ...prev, type: activeTab }));
    setViewMode("create");
  };

  const addPlaceMemberMutation = trpc.admin.addPlaceMember.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Member added" });
      utils.place.getPlaceMembers.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removePlaceMemberMutation = trpc.admin.removePlaceMember.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed",
      });
      utils.place.getPlaceMembers.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter places by search query
  const filteredPlaces = places?.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.city && place.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isVenue = activeTab === "venue" || placeForm.type === "venue";
  const typeLabel = isVenue ? "Venue" : "Organizer";
  const TypeIcon = isVenue ? Building : Building2;

  // List View
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Place Management
            </h1>
            <p className="text-muted-foreground">Create and manage venues and organizers</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create {activeTab === "venue" ? "Venue" : "Organizer"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlaceType)}>
          <TabsList>
            <TabsTrigger value="venue">
              <Building className="mr-2 h-4 w-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="organizer">
              <Building2 className="mr-2 h-4 w-4" />
              Organizers
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab === "venue" ? "venues" : "organizers"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filteredPlaces?.map((place) => (
            <Card key={place.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {place.imageUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                      <TypeIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{place.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {place.city || "No City"}, {place.state || "No State"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateEvent(place.id)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageMembers(place.id)}
                  >
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(place)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!filteredPlaces?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {activeTab === "venue" ? "venues" : "organizers"} found
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
              {viewMode === "edit" ? `Edit ${typeLabel}` : `Create ${typeLabel}`}
            </h1>
            <p className="text-muted-foreground">
              {viewMode === "edit"
                ? `Update ${typeLabel.toLowerCase()} information`
                : `Add a new ${typeLabel.toLowerCase()} to the platform`}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {isVenue && (
              <div>
                <Label htmlFor="place-search">Search {typeLabel} *</Label>
                <GooglePlacesAutocomplete
                  value={placeSearch}
                  onChange={setPlaceSearch}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder={`Search for a ${typeLabel.toLowerCase()} (e.g. Big Night Live Boston)...`}
                  searchType="establishment"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Start typing the {typeLabel.toLowerCase()} name to auto-fill details
                </p>
              </div>
            )}

            <SlugInstagramInput
              slug={placeForm.slug}
              instagram={placeForm.instagram}
              onSlugChange={(slug) => setPlaceForm({ ...placeForm, slug })}
              onInstagramChange={(instagram) =>
                setPlaceForm({ ...placeForm, instagram })
              }
              onBothChange={(slug, instagram) =>
                setPlaceForm({ ...placeForm, slug, instagram })
              }
              isSynced={isSlugSynced}
              onSyncedChange={setIsSlugSynced}
              slugPlaceholder={isVenue ? "big-night-live" : "after-brunch"}
              idPrefix="place"
            />
            <div>
              <Label htmlFor="place-name">Name *</Label>
              <Input
                id="place-name"
                placeholder={isVenue ? "Big Night Live" : "After Brunch"}
                value={placeForm.name}
                onChange={(e) =>
                  setPlaceForm({ ...placeForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{typeLabel} Image</Label>
              <S3Uploader
                folder={isVenue ? "venues" : "organizers"}
                currentImageUrl={placeForm.imageUrl}
                onUploadComplete={(url) =>
                  setPlaceForm({ ...placeForm, imageUrl: url })
                }
                onRemoveImage={() =>
                  setPlaceForm({ ...placeForm, imageUrl: "" })
                }
              />
            </div>
            <div>
              <Label htmlFor="place-description">Description</Label>
              <Textarea
                id="place-description"
                placeholder={isVenue ? "Boston's premier concert venue..." : "Boston's premier social events..."}
                value={placeForm.description}
                onChange={(e) =>
                  setPlaceForm({
                    ...placeForm,
                    description: e.target.value,
                  })
                }
              />
            </div>

            {isVenue ? (
              <>
                <div>
                  <Label htmlFor="place-address">Address</Label>
                  <Input
                    id="place-address"
                    placeholder="110 Causeway St"
                    value={placeForm.address}
                    onChange={(e) =>
                      setPlaceForm({ ...placeForm, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="place-city">City *</Label>
                    <Input
                      id="place-city"
                      placeholder="Boston"
                      value={placeForm.city}
                      onChange={(e) =>
                        setPlaceForm({ ...placeForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="place-state">State *</Label>
                    <Input
                      id="place-state"
                      placeholder="MA"
                      maxLength={2}
                      value={placeForm.state}
                      onChange={(e) =>
                        setPlaceForm({
                          ...placeForm,
                          state: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="place-city">City</Label>
                <GooglePlacesAutocomplete
                  value={placeSearch}
                  onChange={setPlaceSearch}
                  onPlaceSelect={handleCitySelect}
                  placeholder="Search for organizer city..."
                  searchType="cities"
                />
                {placeForm.city && placeForm.state && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {placeForm.city}, {placeForm.state}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="place-website">Website</Label>
              <Input
                id="place-website"
                placeholder={isVenue ? "https://bignightlive.com" : "https://example.com"}
                value={placeForm.website}
                onChange={(e) =>
                  setPlaceForm({ ...placeForm, website: e.target.value })
                }
              />
            </div>

            {isVenue && (
              <>
                <VenueHoursEditor
                  hours={placeForm.hours}
                  onChange={(hours) => setPlaceForm({ ...placeForm, hours })}
                />
                <div>
                  <Label>Categories</Label>
                  <CategoryMultiSelect
                    value={placeForm.categories}
                    onChange={(categories) =>
                      setPlaceForm({ ...placeForm, categories })
                    }
                    placeholder="Select categories..."
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              {viewMode === "edit" ? (
                <Button
                  onClick={() =>
                    updatePlaceMutation.mutate({
                      placeId: editingPlaceId!,
                      ...placeForm,
                      latitude: placeForm.latitude ?? undefined,
                      longitude: placeForm.longitude ?? undefined,
                    })
                  }
                  disabled={
                    updatePlaceMutation.isPending ||
                    !placeForm.slug ||
                    !placeForm.name ||
                    (isVenue && (!placeForm.city || !placeForm.state))
                  }
                >
                  {updatePlaceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update {typeLabel}
                </Button>
              ) : (
                <Button
                  onClick={() => createPlaceMutation.mutate({
                    ...placeForm,
                    latitude: placeForm.latitude ?? undefined,
                    longitude: placeForm.longitude ?? undefined,
                  })}
                  disabled={
                    createPlaceMutation.isPending ||
                    !placeForm.slug ||
                    !placeForm.name ||
                    (isVenue && (!placeForm.city || !placeForm.state))
                  }
                >
                  {createPlaceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create {typeLabel}
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
    const currentPlace = places?.find((p) => p.id === selectedPlace);

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
            <p className="text-muted-foreground">{currentPlace?.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {placeMembers?.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {member.user.username || member.user.email}
                  <button
                    onClick={() =>
                      removePlaceMemberMutation.mutate({
                        placeId: selectedPlace,
                        userId: member.userId,
                      })
                    }
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {!placeMembers?.length && (
                <p className="text-sm text-muted-foreground">No members yet</p>
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
                        addPlaceMemberMutation.mutate({
                          placeId: selectedPlace,
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

  // Create Event View
  if (viewMode === "create-event") {
    const currentPlace = places?.find((p) => p.id === selectedPlace);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        </div>

        <EventForm
          venueId={currentPlace?.type === "venue" ? selectedPlace : undefined}
          organizerId={currentPlace?.type === "organizer" ? selectedPlace : undefined}
          onSuccess={(eventId: string) => {
            utils.admin.listAllPlaces.invalidate();
            handleBack();
          }}
          onCancel={handleBack}
        />
      </div>
    );
  }

  return null;
}
