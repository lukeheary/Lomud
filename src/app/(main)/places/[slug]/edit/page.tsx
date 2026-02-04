"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Building, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  PlaceEditForm,
  type PlaceFormData,
} from "@/components/places/place-edit-form";

export default function EditPlacePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();

  // Fetch place data
  const { data: place, isLoading: placeLoading } =
    trpc.place.getPlaceBySlug.useQuery({ slug });

  // Check if user is admin
  const { data: adminCheck } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

  // Get current user
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const updateMutation = trpc.place.updatePlace.useMutation({
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Place updated successfully",
      });
      // Navigate to the new slug if it changed
      router.push(`/places/${variables.slug || slug}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user can edit this place
  const isMember =
    currentUser &&
    place?.members?.some((member: any) => member.userId === currentUser.id);
  const canEdit = isAdmin || isMember;

  const handleSubmit = (formData: PlaceFormData) => {
    if (!place) return;

    if (!formData.slug || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const isVenue = place.type === "venue";
    if (isVenue && (!formData.city || !formData.state)) {
      toast({
        title: "Validation Error",
        description: "City and state are required for venues",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      placeId: place.id,
      slug: formData.slug,
      name: formData.name,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      website: formData.website || undefined,
      instagram: formData.instagram || undefined,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
      hours: formData.hours ?? undefined,
      categories: formData.categories,
    });
  };

  if (placeLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Place not found</h2>
        <p className="mb-4 text-muted-foreground">
          The place you&apos;re looking for doesn&apos;t exist
        </p>
        <Link href="/places">
          <Button>Browse Places</Button>
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
        <p className="mb-4 text-muted-foreground">
          You don&apos;t have permission to edit this place
        </p>
        <Link href={`/places/${slug}`}>
          <Button>Back to Place</Button>
        </Link>
      </div>
    );
  }

  const isVenue = place.type === "venue";
  const typeLabel = isVenue ? "Venue" : "Organizer";

  const initialData: Partial<PlaceFormData> = {
    type: place.type as "venue" | "organizer",
    slug: place.slug || "",
    name: place.name || "",
    description: place.description || "",
    imageUrl: place.imageUrl || "",
    address: place.address || "",
    city: place.city || "",
    state: place.state || "",
    website: place.website || "",
    instagram: place.instagram || "",
    latitude: place.latitude || null,
    longitude: place.longitude || null,
    hours: (place as any).hours || null,
    categories: (place.categories as string[]) || [],
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-4 py-8">
      <Link
        href={`/places/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {typeLabel}
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Edit {typeLabel}</h1>
        <p className="text-muted-foreground">
          Update {typeLabel.toLowerCase()} information
        </p>
      </div>

      <PlaceEditForm
        initialData={initialData}
        placeType={place.type as "venue" | "organizer"}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/places/${slug}`)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
