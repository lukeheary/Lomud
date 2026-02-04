"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Building2, Loader2 } from "lucide-react";
import { S3Uploader } from "@/components/ui/s3-uploader";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { SlugInstagramInput } from "@/components/slug-instagram-input";
import {
  VenueHoursEditor,
  type VenueHours,
} from "@/components/venue-hours-editor";

export type PlaceType = "venue" | "organizer";

export interface PlaceFormData {
  type: PlaceType;
  slug: string;
  name: string;
  description: string;
  logoImageUrl: string;
  coverImageUrl: string;
  address: string;
  city: string;
  state: string;
  website: string;
  instagram: string;
  latitude: number | null;
  longitude: number | null;
  hours: VenueHours | null;
  categories: string[];
}

interface PlaceEditFormProps {
  initialData?: Partial<PlaceFormData>;
  placeType: PlaceType;
  placeId?: string; // Required for edit mode to upload to correct S3 path
  mode: "create" | "edit";
  onSubmit: (data: PlaceFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  showCard?: boolean;
}

const emptyFormData: PlaceFormData = {
  type: "venue",
  slug: "",
  name: "",
  description: "",
  logoImageUrl: "",
  coverImageUrl: "",
  address: "",
  city: "",
  state: "",
  website: "",
  instagram: "",
  latitude: null,
  longitude: null,
  hours: null,
  categories: [],
};

export function PlaceEditForm({
  initialData,
  placeType,
  placeId,
  mode,
  onSubmit,
  onCancel,
  isSubmitting,
  showCard = true,
}: PlaceEditFormProps) {
  const initialDataVersion = useMemo(
    () =>
      JSON.stringify({
        type: placeType,
        slug: initialData?.slug ?? "",
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        logoImageUrl: initialData?.logoImageUrl ?? "",
        coverImageUrl: initialData?.coverImageUrl ?? "",
        address: initialData?.address ?? "",
        city: initialData?.city ?? "",
        state: initialData?.state ?? "",
        website: initialData?.website ?? "",
        instagram: initialData?.instagram ?? "",
        latitude: initialData?.latitude ?? null,
        longitude: initialData?.longitude ?? null,
        hours: initialData?.hours ?? null,
        categories: initialData?.categories ?? [],
      }),
    [initialData, placeType]
  );

  const [formData, setFormData] = useState<PlaceFormData>({
    ...emptyFormData,
    type: placeType,
    ...initialData,
  });

  const [placeSearch, setPlaceSearch] = useState(initialData?.name || "");
  const [isSlugSynced, setIsSlugSynced] = useState(
    (initialData?.slug || "") === (initialData?.instagram || "")
  );

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptyFormData,
        type: placeType,
        ...initialData,
      });
      setPlaceSearch(initialData.name || "");
      setIsSlugSynced(
        (initialData.slug || "") === (initialData.instagram || "")
      );
    }
  }, [initialDataVersion, placeType]);

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

      setFormData((prev) => ({
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
      latitude?: number;
      longitude?: number;
    }) => {
      setFormData((prev) => ({
        ...prev,
        city: place.city,
        state: place.state,
        latitude: place.latitude ?? null,
        longitude: place.longitude ?? null,
      }));
      setPlaceSearch(place.city);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isVenue = placeType === "venue";
  const typeLabel = isVenue ? "Venue" : "Organizer";

  const isFormValid =
    formData.slug &&
    formData.name &&
    (!isVenue || (formData.city && formData.state));

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google Places Search (for venues) */}
      {isVenue && (
        <div>
          <Label htmlFor="place-search">Search {typeLabel}</Label>
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

      {/* Slug & Instagram */}
      <SlugInstagramInput
        slug={formData.slug}
        instagram={formData.instagram}
        onSlugChange={(slug) => setFormData({ ...formData, slug })}
        onInstagramChange={(instagram) =>
          setFormData({ ...formData, instagram })
        }
        onBothChange={(slug, instagram) =>
          setFormData({ ...formData, slug, instagram })
        }
        isSynced={isSlugSynced}
        onSyncedChange={setIsSlugSynced}
        slugPlaceholder={isVenue ? "big-night-live" : "after-brunch"}
        idPrefix="place"
      />

      {/* Name */}
      <div>
        <Label htmlFor="place-name">Name *</Label>
        <Input
          id="place-name"
          placeholder={isVenue ? "Big Night Live" : "After Brunch"}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Profile Image */}
      <div>
        <Label>{typeLabel} Profile Image</Label>
        <S3Uploader
          folder={placeId ? `places/${placeId}` : "places"}
          fileName="logoImage.png"
          currentImageUrl={formData.logoImageUrl}
          onUploadComplete={(url) =>
            setFormData((prev) => ({ ...prev, logoImageUrl: url }))
          }
          onRemoveImage={() =>
            setFormData((prev) => ({ ...prev, logoImageUrl: "" }))
          }
          aspectRatio="square"
          className={"w-48"}
        />
      </div>

      {/* Banner Image */}
      <div>
        <Label>Banner Image (Optional)</Label>
        <S3Uploader
          folder={placeId ? `places/${placeId}` : "places"}
          fileName="coverImage.png"
          currentImageUrl={formData.coverImageUrl}
          onUploadComplete={(url) =>
            setFormData((prev) => ({ ...prev, coverImageUrl: url }))
          }
          onRemoveImage={() =>
            setFormData((prev) => ({ ...prev, coverImageUrl: "" }))
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          If no banner is set, the next upcoming event cover or profile image
          will be used
        </p>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="place-description">Description</Label>
        <Textarea
          id="place-description"
          placeholder={
            isVenue
              ? "Boston's premier concert venue..."
              : "Boston's premier social events..."
          }
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
        />
      </div>

      {/* Address & Location */}
      {isVenue ? (
        <>
          <div>
            <Label htmlFor="place-address">Address</Label>
            <Input
              id="place-address"
              placeholder="110 Causeway St"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="place-city">City *</Label>
              <Input
                id="place-city"
                placeholder="Boston"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="place-state">State *</Label>
              <Input
                id="place-state"
                placeholder="MA"
                maxLength={2}
                value={formData.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
          {formData.city && formData.state && (
            <p className="text-xs text-muted-foreground">
              Selected: {formData.city}, {formData.state}
            </p>
          )}
        </div>
      )}

      {/* Website */}
      <div>
        <Label htmlFor="place-website">Website</Label>
        <Input
          id="place-website"
          placeholder={
            isVenue ? "https://bignightlive.com" : "https://example.com"
          }
          value={formData.website}
          onChange={(e) =>
            setFormData({ ...formData, website: e.target.value })
          }
        />
      </div>

      {/* Venue-specific fields */}
      {isVenue && (
        <>
          <VenueHoursEditor
            hours={formData.hours}
            onChange={(hours) => setFormData({ ...formData, hours })}
          />
          <div>
            <Label>Categories</Label>
            <CategoryMultiSelect
              value={formData.categories}
              onChange={(categories) =>
                setFormData({ ...formData, categories })
              }
              placeholder="Select categories..."
            />
          </div>
        </>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !isFormValid}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Update" : "Create"} {typeLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );

  if (showCard) {
    return (
      <Card>
        <CardContent className="pt-6">{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
}
