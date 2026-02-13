"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButtonHeader } from "@/components/shared/back-button-header";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  ExternalLink,
  MapPin,
  Calendar,
  ImageIcon,
  CheckCircle2,
  Download,
  Search,
  Building,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface ScrapedEvent {
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  eventUrl: string | null;
  externalId: string | null;
  startAt: string;
  endAt: string | null;
  venueName: string;
  address: string;
  city: string;
  state: string;
  categories: string[];
  visibility: string;
  source: string;
  eventStatus: string;
  organizerName: string | null;
  organizerUrl: string | null;
}

interface ScrapeResult {
  organizer: {
    name: string;
    url: string;
  } | null;
  events: ScrapedEvent[];
  totalEvents: number;
  errors?: { url: string; error: string }[];
}

interface SelectedPlace {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address?: string | null;
}

type EditableEvent = ScrapedEvent & {
  venueId?: string | null;
  linkedVenue?: SelectedPlace | null;
};

function PlaceDropdown({
  type,
  selected,
  onSelect,
  placeholder,
}: {
  type: "venue" | "organizer";
  selected: SelectedPlace | null;
  onSelect: (place: SelectedPlace | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: results, isLoading } = trpc.place.searchPlaces.useQuery(
    { query: search, type },
    { enabled: search.length > 2 }
  );

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">{selected.name}</span>
        {selected.city && selected.state && (
          <span className="text-muted-foreground">
            {selected.city}, {selected.state}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onSelect(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between text-muted-foreground"
          size="sm"
        >
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {placeholder}
          </span>
          <Search className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-auto p-1">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isLoading &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            results?.map((v: any) => (
              <button
                key={v.id}
                type="button"
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onSelect({
                    id: v.id,
                    name: v.name,
                    city: v.city,
                    state: v.state,
                    address: v.address ?? null,
                  });
                  setOpen(false);
                  setSearch("");
                }}
              >
                <div className="font-medium">{v.name}</div>
                {v.city && v.state && (
                  <div className="text-xs text-muted-foreground">
                    {v.city}, {v.state}
                  </div>
                )}
              </button>
            ))}
          {!isLoading && search.length > 2 && results?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No venues found
            </p>
          )}
          {search.length <= 2 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Type at least 3 characters...
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EventCard({
  event,
  selectedVenue,
  onSelectVenue,
}: {
  event: EditableEvent;
  selectedVenue: SelectedPlace | null;
  onSelectVenue: (venue: SelectedPlace | null) => void;
}) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-24 w-24 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{event.title}</h3>
              <a
                href={event.eventUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {event.startAt
                  ? format(
                      new Date(event.startAt),
                      "EEE, MMM d yyyy 'at' h:mm a"
                    )
                  : "No date"}
              </span>
              {event.endAt && (
                <span className="text-xs">
                  — {format(new Date(event.endAt), "h:mm a")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{event.venueName || "Venue not set"}</span>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-muted-foreground">
                Link to existing venue
              </p>
              <PlaceDropdown
                type="venue"
                selected={selectedVenue}
                onSelect={onSelectVenue}
                placeholder="Link to a venue (optional)"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
            </div>

            {event.description && (
              <p
                className={`text-sm text-muted-foreground ${!showFullDesc ? "line-clamp-2" : ""}`}
                onClick={() => setShowFullDesc(!showFullDesc)}
              >
                {event.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
          <p className="mb-1 font-medium text-muted-foreground">
            Schema mapping:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
            <span>
              title: <span className="text-foreground">{event.title}</span>
            </span>
            <span>
              venueName:{" "}
              <span className="text-foreground">{event.venueName}</span>
            </span>
            <span>
              city: <span className="text-foreground">{event.city}</span>
            </span>
            <span>
              state: <span className="text-foreground">{event.state}</span>
            </span>
            <span>
              startAt: <span className="text-foreground">{event.startAt}</span>
            </span>
            <span>
              endAt:{" "}
              <span className="text-foreground">{event.endAt || "null"}</span>
            </span>
            <span>
              coverImageUrl:{" "}
              <span className="text-foreground">
                {event.coverImageUrl ? "yes" : "null"}
              </span>
            </span>
            <span>
              externalId:{" "}
              <span className="text-foreground">
                {event.externalId || "null"}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScrapePoshPage() {
  const [urlsText, setUrlsText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [editableEvents, setEditableEvents] = useState<EditableEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<SelectedPlace | null>(
    null
  );
  const [selectedOrganizer, setSelectedOrganizer] =
    useState<SelectedPlace | null>(null);
  const { toast } = useToast();

  const batchCreate = trpc.event.batchCreateEvents.useMutation({
    onSuccess: (data) => {
      setImportedCount(data.created);
      toast({
        title: "Events imported",
        description: `${data.created} events added to WIG${selectedVenue ? ` (default venue: ${selectedVenue.name})` : ""}`,
      });
    },
    onError: (err) => {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (result?.events) {
      setEditableEvents(
        result.events.map((event) => ({
          ...event,
          venueId: null,
          linkedVenue: null,
        }))
      );
    } else {
      setEditableEvents([]);
    }
  }, [result]);

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImportedCount(null);

    try {
      // Parse URLs from textarea (one per line, comma-separated, or space-separated)
      const urls = urlsText
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      if (urls.length === 0) {
        setError("Please paste at least one Posh event URL");
        return;
      }

      const response = await fetch("/api/scrape-posh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to scrape");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!result || editableEvents.length === 0) return;

    const events = editableEvents.map((event) => ({
      title: event.title,
      description: event.description ?? undefined,
      coverImageUrl: event.coverImageUrl ?? undefined,
      eventUrl: event.eventUrl ?? undefined,
      source: event.source ?? undefined,
      externalId: event.externalId ?? undefined,
      startAt: new Date(event.startAt),
      endAt: event.endAt ? new Date(event.endAt) : undefined,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      state: event.state,
      venueId: event.venueId ?? undefined,
      categories: event.categories,
      visibility: event.visibility as "public" | "private",
    }));

    batchCreate.mutate({
      venueId: selectedVenue?.id,
      organizerId: selectedOrganizer?.id,
      events,
    });
  };

  const updateEvent = (index: number, patch: Partial<EditableEvent>) => {
    setEditableEvents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const applyDefaultVenueToAll = () => {
    if (!selectedVenue) return;
    setEditableEvents((prev) =>
      prev.map((event) => ({
        ...event,
        venueId: selectedVenue.id,
        linkedVenue: selectedVenue,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <BackButtonHeader
        backHref="/admin"
        title="Posh Scraper"
        subtitle="Scrape events from posh.vip event pages using JSON-LD data"
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Posh Event URLs
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`Paste Posh event URLs (one per line):\nhttps://posh.vip/e/event-name-1\nhttps://posh.vip/e/event-name-2\n\nOr paste a group URL:\nhttps://posh.vip/g/afterbrunch`}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Paste individual event URLs (posh.vip/e/...) for best results.
              Group URLs (posh.vip/g/...) are supported, but if no events are
              found, try pasting the individual event links instead.
            </p>
          </div>
          <Button onClick={handleScrape} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Scrape Events
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {result.organizer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  {result.organizer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {result.organizer.url && (
                  <a
                    href={result.organizer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {result.organizer.url}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {result.errors && result.errors.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} URL(s) failed to scrape
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <p key={i}>
                      <span className="font-mono">{err.url}</span>: {err.error}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Default venue (optional)</p>
                <PlaceDropdown
                  type="venue"
                  selected={selectedVenue}
                  onSelect={setSelectedVenue}
                  placeholder="Link to a venue (optional)"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyDefaultVenueToAll}
                    disabled={!selectedVenue}
                  >
                    Apply default to all events
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Organizer (optional)</p>
                <PlaceDropdown
                  type="organizer"
                  selected={selectedOrganizer}
                  onSelect={setSelectedOrganizer}
                  placeholder="Link to an organizer (optional)"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {editableEvents.length} events to import
                </p>

                {importedCount !== null ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {importedCount} events imported
                  </div>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={batchCreate.isPending}
                    size="sm"
                  >
                    {batchCreate.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Add All to WIG
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {editableEvents.map((event, index) => {
              return (
                <EventCard
                  key={index}
                  event={event}
                  selectedVenue={event.linkedVenue ?? null}
                  onSelectVenue={(venue) => {
                    if (venue) {
                      updateEvent(index, {
                        venueId: venue.id,
                        linkedVenue: venue,
                      });
                    } else {
                      updateEvent(index, {
                        venueId: null,
                        linkedVenue: null,
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
