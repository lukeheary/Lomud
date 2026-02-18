"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Building,
  Building2,
  Plus,
  Users as UsersIcon,
  Search,
  Calendar,
  Repeat,
} from "lucide-react";
import { EventForm } from "@/components/events/event-form";
import {
  PlaceEditForm,
  type PlaceFormData,
  type PlaceType,
} from "@/components/places/place-edit-form";
import { PlaceMembersManager } from "@/components/places/place-members-manager";
import { BackButtonHeader } from "@/components/shared/back-button-header";

type ViewMode =
  | "list"
  | "create"
  | "edit"
  | "members"
  | "create-event"
  | "create-recurring-event";

export default function AdminPlacesPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const searchParams = useSearchParams();
  const didInitFromParams = useRef(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PlaceType>("venue");

  // Edit mode state
  const [editingPlace, setEditingPlace] = useState<any>(null);

  // Member management state
  const [selectedPlace, setSelectedPlace] = useState<string>("");

  useEffect(() => {
    if (didInitFromParams.current) return;
    const typeParam = searchParams.get("type");
    if (typeParam === "venue" || typeParam === "organizer") {
      setActiveTab(typeParam);
    }
    const createTarget = searchParams.get("create");
    if (createTarget === "venue" || createTarget === "organizer") {
      setActiveTab(createTarget);
      setViewMode("create");
    }
    didInitFromParams.current = true;
  }, [searchParams]);

  // Fetch data
  const { data: places } = trpc.admin.listAllPlaces.useQuery({
    type: activeTab,
  });

  // Mutations
  const createPlaceMutation = trpc.admin.createPlace.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${activeTab === "venue" ? "Venue" : "Organizer"} created successfully`,
      });
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
      toast({
        title: "Success",
        description: `${activeTab === "venue" ? "Venue" : "Organizer"} updated successfully`,
      });
      setEditingPlace(null);
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
    setEditingPlace(place);
    setViewMode("edit");
  };

  const handleBack = () => {
    setEditingPlace(null);
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

  const handleCreateRecurringEvent = (placeId: string) => {
    setSelectedPlace(placeId);
    setViewMode("create-recurring-event");
  };

  const handleCreate = () => {
    setViewMode("create");
  };

  const handleCreateSubmit = (formData: PlaceFormData) => {
    createPlaceMutation.mutate({
      ...formData,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
    });
  };

  const handleEditSubmit = (formData: PlaceFormData) => {
    if (!editingPlace) return;

    updatePlaceMutation.mutate({
      placeId: editingPlace.id,
      ...formData,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
    });
  };

  // Filter places by search query
  const filteredPlaces = places?.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.city &&
        place.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isVenue = activeTab === "venue";
  const typeLabel = isVenue ? "Venue" : "Organizer";
  const TypeIcon = isVenue ? Building : Building2;

  // List View
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <BackButtonHeader
            backHref="/admin"
            title={activeTab === "venue" ? "Venues" : "Organizers"}
            className="min-w-0"
          />
          <div className="flex items-center gap-2">
            {/*<Button*/}
            {/*  variant="outline"*/}
            {/*  onClick={() => {*/}
            {/*    setSelectedPlace("");*/}
            {/*    setViewMode("create-recurring-event");*/}
            {/*  }}*/}
            {/*>*/}
            {/*  <Repeat className="mr-2 h-4 w-4" />*/}
            {/*  <span className="hidden sm:inline">Create New Recurring Event</span>*/}
            {/*  <span className="sm:hidden">Recurring</span>*/}
            {/*</Button>*/}
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">
                Add {activeTab === "venue" ? "Venue" : "Organizer"}
              </span>
            </Button>
          </div>
        </div>

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
              <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  {place.logoImageUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                      <img
                        src={place.logoImageUrl}
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
                    onClick={() => handleCreateRecurringEvent(place.id)}
                  >
                    <Repeat className="mr-2 h-4 w-4" />
                    Add Recurring
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
    const initialData: Partial<PlaceFormData> | undefined =
      viewMode === "edit" && editingPlace
        ? {
            type: editingPlace.type,
            slug: editingPlace.slug || "",
            name: editingPlace.name || "",
            description: editingPlace.description || "",
            logoImageUrl: editingPlace.logoImageUrl || "",
            coverImageUrl: editingPlace.coverImageUrl || "",
            address: editingPlace.address || "",
            city: editingPlace.city || "",
            state: editingPlace.state || "",
            website: editingPlace.website || "",
            instagram: editingPlace.instagram || "",
            latitude: editingPlace.latitude || null,
            longitude: editingPlace.longitude || null,
            hours: editingPlace.hours || null,
            categories: editingPlace.categories || [],
          }
        : { type: activeTab };

    return (
      <div className="space-y-6">
        <BackButtonHeader
          onBack={handleBack}
          title={
            viewMode === "edit" ? `Edit ${typeLabel}` : `Create ${typeLabel}`
          }
        />

        <PlaceEditForm
          initialData={initialData}
          placeType={viewMode === "edit" ? editingPlace?.type : activeTab}
          placeId={viewMode === "edit" ? editingPlace?.id : undefined}
          mode={viewMode === "edit" ? "edit" : "create"}
          onSubmit={viewMode === "edit" ? handleEditSubmit : handleCreateSubmit}
          onCancel={handleBack}
          isSubmitting={
            viewMode === "edit"
              ? updatePlaceMutation.isPending
              : createPlaceMutation.isPending
          }
        />
      </div>
    );
  }

  // Members View
  if (viewMode === "members") {
    const currentPlace = places?.find((p) => p.id === selectedPlace);

    return (
      <div className="space-y-6">
        <BackButtonHeader
          onBack={handleBack}
          title="Manage Members"
          subtitle={currentPlace?.name}
        />

        <PlaceMembersManager
          placeId={selectedPlace}
          placeName={currentPlace?.name}
          placeType={currentPlace?.type as "venue" | "organizer"}
          showTitle={false}
          canManage={true}
        />
      </div>
    );
  }

  // Create Event View
  if (viewMode === "create-event" || viewMode === "create-recurring-event") {
    const currentPlace = places?.find((p) => p.id === selectedPlace);
    const isRecurring = viewMode === "create-recurring-event";

    return (
      <div className="space-y-6">
        <BackButtonHeader
          onBack={handleBack}
          title={isRecurring ? "Create Recurring Event" : "Create Event"}
        />

        <EventForm
          venueId={currentPlace?.type === "venue" ? selectedPlace : undefined}
          organizerId={
            currentPlace?.type === "organizer" ? selectedPlace : undefined
          }
          isRecurringDefault={isRecurring}
          onSuccess={() => {
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
