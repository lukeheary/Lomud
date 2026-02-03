"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@clerk/nextjs";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { S3Uploader } from "@/components/ui/s3-uploader";

export default function ProfilePage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    isError,
  } = trpc.user.getCurrentUser.useQuery();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [searchCity, setSearchCity] = useState("");
  // const [isEditing, setIsEditing] = useState(false);

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setImageUrl(user.imageUrl || "");
      setCity(user.city || "");
      setState(user.state || "");
      setSearchCity(user.city || "");
    }
  }, [user]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (data) => {
      console.log("Profile updated successfully:", data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      // Invalidate all user-related queries to refresh data
      utils.user.getCurrentUser.invalidate();
      utils.user.isAdmin.invalidate();
      // setIsEditing(false);
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    // Immediately update the profile with the new image URL
    updateProfileMutation.mutate({
      imageUrl: url,
    });
  };

  const handleCitySelect = useCallback(
    (place: {
      name: string;
      address: string;
      city: string;
      state: string;
      formattedAddress: string;
    }) => {
      setCity(place.city);
      setState(place.state);
      setSearchCity(place.city);
    },
    []
  );

  const handleSave = () => {
    updateProfileMutation.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      imageUrl: imageUrl || undefined,
      city: city || undefined,
      state: state || undefined,
    });
  };

  const handleCancel = () => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setImageUrl(user.imageUrl || "");
      setCity(user.city || "");
      setState(user.state || "");
      setSearchCity(user.city || "");
    }
    // setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || isError) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          {isError
            ? "Error loading profile. Please try again."
            : "User not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        {/*<UserButton afterSignOutUrl="/sign-in" />*/}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-6">
            <UserAvatar
              src={imageUrl || user.imageUrl}
              name={firstName || user.firstName}
              className="h-24 w-24"
            />
            <div className="space-y-2">
              <S3Uploader
                folder={`profiles/${user.id}`}
                fileName="avatar.png"
                onUploadComplete={handleImageUpload}
                variant="button"
                buttonText="Upload Profile Image"
                maxSizeMB={4}
              />
              <p className="text-xs text-muted-foreground">Max 4MB.</p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                // disabled={!isEditing}
                placeholder="Enter your first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                // disabled={!isEditing}
                placeholder="Enter your last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Manage your email in account
                settings.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Username cannot be changed after initial setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <GooglePlacesAutocomplete
                value={searchCity}
                onChange={setSearchCity}
                onPlaceSelect={handleCitySelect}
                placeholder="Search for your city..."
                searchType="cities"
              />
              {city && state && (
                <p className="text-xs text-muted-foreground">
                  Selected: {city}, {state}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/*{!isEditing ? (*/}
            {/*  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>*/}
            {/*) : (*/}
            <>
              <Button
                onClick={handleSave}
                disabled={
                  updateProfileMutation.isPending ||
                  (firstName === (user.firstName || "") &&
                    lastName === (user.lastName || "") &&
                    city === (user.city || "") &&
                    state === (user.state || ""))
                }
              >
                {updateProfileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
            </>
            {/*)}*/}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings Card */}
      {/*<Card>*/}
      {/*  <CardHeader>*/}
      {/*    <CardTitle>Account Settings</CardTitle>*/}
      {/*  </CardHeader>*/}
      {/*  <CardContent>*/}
      {/*    <p className="text-sm text-muted-foreground mb-4">*/}
      {/*      Manage your account security, email preferences, and authentication settings.*/}
      {/*    </p>*/}
      {/*    <div className="flex items-center gap-2">*/}
      {/*      <UserButton afterSignOutUrl="/sign-in" appearance={{*/}
      {/*        elements: {*/}
      {/*          rootBox: "inline-flex",*/}
      {/*          userButtonAvatarBox: "w-10 h-10"*/}
      {/*        }*/}
      {/*      }} />*/}
      {/*      <div className="text-sm">*/}
      {/*        <p className="font-medium">Account Management</p>*/}
      {/*        <p className="text-muted-foreground">Click to manage your account settings</p>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </CardContent>*/}
      {/*</Card>*/}
    </div>
  );
}
