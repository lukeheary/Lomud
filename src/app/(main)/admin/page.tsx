"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Loader2, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Check if user is admin
  const { data: adminCheck, isLoading: adminCheckLoading } = trpc.user.isAdmin.useQuery();
  const isAdmin = adminCheck?.isAdmin ?? false;

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

  // Organizer form state
  const [organizerForm, setOrganizerForm] = useState({
    slug: "",
    name: "",
    description: "",
    imageUrl: "",
    website: "",
    instagram: "",
  });

  // Member management state
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");

  // Fetch data
  const { data: venues } = trpc.admin.listAllVenues.useQuery(undefined, { enabled: isAdmin });
  const { data: organizers } = trpc.admin.listAllOrganizers.useQuery(undefined, { enabled: isAdmin });

  const { data: venueMembers } = trpc.venue.getVenueMembers.useQuery(
    { venueId: selectedVenue },
    { enabled: !!selectedVenue && isAdmin }
  );

  const { data: organizerMembers } = trpc.organizer.getOrganizerMembers.useQuery(
    { organizerId: selectedOrganizer },
    { enabled: !!selectedOrganizer && isAdmin }
  );

  const { data: searchedUsers } = trpc.admin.searchUsers.useQuery(
    { search: userSearch },
    { enabled: userSearch.length >= 2 && isAdmin }
  );

  // Mutations
  const createVenueMutation = trpc.admin.createVenue.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Venue created successfully" });
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
      utils.admin.listAllVenues.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createOrganizerMutation = trpc.admin.createOrganizer.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Organizer created successfully" });
      setOrganizerForm({
        slug: "",
        name: "",
        description: "",
        imageUrl: "",
        website: "",
        instagram: "",
      });
      utils.admin.listAllOrganizers.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addVenueMemberMutation = trpc.admin.addVenueMember.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Member added to venue" });
      utils.venue.getVenueMembers.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeVenueMemberMutation = trpc.admin.removeVenueMember.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Member removed from venue" });
      utils.venue.getVenueMembers.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addOrganizerMemberMutation = trpc.admin.addOrganizerMember.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Member added to organizer" });
      utils.organizer.getOrganizerMembers.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeOrganizerMemberMutation = trpc.admin.removeOrganizerMember.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Member removed from organizer" });
      utils.organizer.getOrganizerMembers.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Redirect if not admin
  if (!adminCheckLoading && !isAdmin) {
    router.push("/");
    return null;
  }

  if (adminCheckLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">Manage venues, organizers, and their members</p>
      </div>

      {/* Create Venue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Venue
          </CardTitle>
          <CardDescription>Add a new venue to the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue-slug">Slug *</Label>
              <Input
                id="venue-slug"
                placeholder="big-night-live"
                value={venueForm.slug}
                onChange={(e) => setVenueForm({ ...venueForm, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="venue-name">Name *</Label>
              <Input
                id="venue-name"
                placeholder="Big Night Live"
                value={venueForm.name}
                onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="venue-description">Description</Label>
            <Textarea
              id="venue-description"
              placeholder="A premier entertainment venue..."
              value={venueForm.description}
              onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue-address">Address</Label>
              <Input
                id="venue-address"
                placeholder="110 Causeway St"
                value={venueForm.address}
                onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="venue-city">City *</Label>
                <Input
                  id="venue-city"
                  placeholder="Boston"
                  value={venueForm.city}
                  onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="venue-state">State *</Label>
                <Input
                  id="venue-state"
                  placeholder="MA"
                  maxLength={2}
                  value={venueForm.state}
                  onChange={(e) => setVenueForm({ ...venueForm, state: e.target.value.toUpperCase() })}
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
                onChange={(e) => setVenueForm({ ...venueForm, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="venue-instagram">Instagram</Label>
              <Input
                id="venue-instagram"
                placeholder="bignightlive"
                value={venueForm.instagram}
                onChange={(e) => setVenueForm({ ...venueForm, instagram: e.target.value })}
              />
            </div>
          </div>
          <Button
            onClick={() => createVenueMutation.mutate(venueForm)}
            disabled={createVenueMutation.isPending || !venueForm.slug || !venueForm.name || !venueForm.city || !venueForm.state}
          >
            {createVenueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Venue
          </Button>
        </CardContent>
      </Card>

      {/* Create Organizer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Organizer
          </CardTitle>
          <CardDescription>Add a new event organizer to the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organizer-slug">Slug *</Label>
              <Input
                id="organizer-slug"
                placeholder="after-brunch"
                value={organizerForm.slug}
                onChange={(e) => setOrganizerForm({ ...organizerForm, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="organizer-name">Name *</Label>
              <Input
                id="organizer-name"
                placeholder="After Brunch"
                value={organizerForm.name}
                onChange={(e) => setOrganizerForm({ ...organizerForm, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="organizer-description">Description</Label>
            <Textarea
              id="organizer-description"
              placeholder="Boston's premier social events..."
              value={organizerForm.description}
              onChange={(e) => setOrganizerForm({ ...organizerForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organizer-website">Website</Label>
              <Input
                id="organizer-website"
                placeholder="https://example.com"
                value={organizerForm.website}
                onChange={(e) => setOrganizerForm({ ...organizerForm, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="organizer-instagram">Instagram</Label>
              <Input
                id="organizer-instagram"
                placeholder="afterbrunch"
                value={organizerForm.instagram}
                onChange={(e) => setOrganizerForm({ ...organizerForm, instagram: e.target.value })}
              />
            </div>
          </div>
          <Button
            onClick={() => createOrganizerMutation.mutate(organizerForm)}
            disabled={createOrganizerMutation.isPending || !organizerForm.slug || !organizerForm.name}
          >
            {createOrganizerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Organizer
          </Button>
        </CardContent>
      </Card>

      {/* Manage Venue Members */}
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {venueMembers?.map((member) => (
                    <Badge key={member.id} variant="secondary" className="flex items-center gap-2">
                      {member.user.username || member.user.email}
                      <button
                        onClick={() => removeVenueMemberMutation.mutate({
                          venueId: selectedVenue,
                          userId: member.userId,
                        })}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {!venueMembers?.length && (
                    <p className="text-sm text-muted-foreground">No members yet</p>
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
                  <div className="mt-2 border rounded-md divide-y">
                    {searchedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2">
                        <span className="text-sm">{user.username || user.email}</span>
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
                          <Plus className="h-4 w-4 mr-1" />
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

      {/* Manage Organizer Members */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Organizer Members</CardTitle>
          <CardDescription>Add or remove members from organizers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="select-organizer">Select Organizer</Label>
            <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {organizerMembers?.map((member) => (
                    <Badge key={member.id} variant="secondary" className="flex items-center gap-2">
                      {member.user.username || member.user.email}
                      <button
                        onClick={() => removeOrganizerMemberMutation.mutate({
                          organizerId: selectedOrganizer,
                          userId: member.userId,
                        })}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {!organizerMembers?.length && (
                    <p className="text-sm text-muted-foreground">No members yet</p>
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
                  <div className="mt-2 border rounded-md divide-y">
                    {searchedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2">
                        <span className="text-sm">{user.username || user.email}</span>
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
                          <Plus className="h-4 w-4 mr-1" />
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
  );
}
