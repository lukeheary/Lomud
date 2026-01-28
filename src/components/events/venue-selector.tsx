"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, X } from "lucide-react";
import { US_STATES } from "@/lib/utils";

export interface VenueData {
    id?: string;
    name: string;
    address?: string;
    city: string;
    state: string;
    categories?: string[];
}

interface VenueSelectorProps {
    selectedVenue: VenueData | null;
    onVenueSelect: (venue: VenueData | null) => void;
    isCreatingNew: boolean;
    setIsCreatingNew: (isCreating: boolean) => void;
    errors?: {
        venueName?: string;
        city?: string;
        state?: string;
    };
}

export function VenueSelector({
    selectedVenue,
    onVenueSelect,
    isCreatingNew,
    setIsCreatingNew,
    errors,
}: VenueSelectorProps) {
    const [venueSearch, setVenueSearch] = useState("");
    const [isVenuePopoverOpen, setIsVenuePopoverOpen] = useState(false);

    const { data: searchResults, isLoading: isSearchingVenues } =
        trpc.venue.searchVenues.useQuery(
            { query: venueSearch },
            { enabled: venueSearch.length > 2 }
        );

    const handleCreateNewToggle = () => {
        const nextMode = !isCreatingNew;
        setIsCreatingNew(nextMode);

        // Reset selection when toggling
        if (nextMode) {
            // Starting new
            onVenueSelect({
                name: "",
                address: "",
                city: "",
                state: "",
            });
        } else {
            // Switching back to search
            onVenueSelect(null);
        }
    };

    const clearSelection = () => {
        onVenueSelect(null);
    };

    return (
        <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Venue</Label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNewToggle}
                >
                    {isCreatingNew ? "Select Existing" : "Add New Venue"}
                </Button>
            </div>

            {!isCreatingNew ? (
                <div className="space-y-4">
                    <Popover
                        open={isVenuePopoverOpen}
                        onOpenChange={setIsVenuePopoverOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isVenuePopoverOpen}
                                className="w-full justify-between"
                            >
                                {selectedVenue?.id
                                    ? selectedVenue.name
                                    : "Search for a venue..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <div className="flex flex-col">
                                <div className="flex items-center border-b px-3 py-2">
                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <input
                                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Type to search..."
                                        value={venueSearch}
                                        onChange={(e) => setVenueSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-[300px] overflow-auto p-1">
                                    {isSearchingVenues && (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    )}
                                    {!isSearchingVenues &&
                                        searchResults?.map((v: any) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => {
                                                    onVenueSelect({
                                                        id: v.id,
                                                        name: v.name,
                                                        address: v.address || "",
                                                        city: v.city,
                                                        state: v.state,
                                                        categories: (v.categories as string[]) || [],
                                                    });
                                                    setIsVenuePopoverOpen(false);
                                                }}
                                            >
                                                <div className="font-medium">{v.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {v.city}, {v.state}
                                                </div>
                                            </button>
                                        ))}
                                    {!isSearchingVenues &&
                                        venueSearch.length > 2 &&
                                        searchResults?.length === 0 && (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                No venues found.
                                            </div>
                                        )}
                                    {venueSearch.length <= 2 && (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Type at least 3 characters...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {selectedVenue?.id && (
                        <div className="relative rounded-md bg-background p-3 text-sm shadow-sm ring-1 ring-border">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={clearSelection}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <div className="font-semibold text-primary">
                                {selectedVenue.name}
                            </div>
                            <div className="text-muted-foreground">
                                {selectedVenue.address && (
                                    <div className="flex items-center gap-1">
                                        {selectedVenue.address}
                                    </div>
                                )}
                                <div>
                                    {selectedVenue.city}, {selectedVenue.state}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="venueName">Venue Name</Label>
                        <Input
                            id="venueName"
                            value={selectedVenue?.name || ""}
                            onChange={(e) =>
                                onVenueSelect({
                                    ...selectedVenue,
                                    name: e.target.value,
                                } as VenueData)
                            }
                            placeholder="The Grand Theater"
                            className={errors?.venueName ? "border-destructive" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                            id="address"
                            value={selectedVenue?.address || ""}
                            onChange={(e) =>
                                onVenueSelect({
                                    ...selectedVenue,
                                    address: e.target.value,
                                } as VenueData)
                            }
                            placeholder="123 Main St"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="city">
                                City <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="city"
                                value={selectedVenue?.city || ""}
                                onChange={(e) =>
                                    onVenueSelect({
                                        ...selectedVenue,
                                        city: e.target.value,
                                    } as VenueData)
                                }
                                placeholder="San Francisco"
                                className={errors?.city ? "border-destructive" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">
                                State <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={selectedVenue?.state || ""}
                                onValueChange={(value) =>
                                    onVenueSelect({
                                        ...selectedVenue,
                                        state: value,
                                    } as VenueData)
                                }
                            >
                                <SelectTrigger className={errors?.state ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {US_STATES.map((state) => (
                                        <SelectItem key={state.value} value={state.value}>
                                            {state.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
