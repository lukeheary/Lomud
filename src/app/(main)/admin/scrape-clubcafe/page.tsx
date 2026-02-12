"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

interface ScrapeResult {
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  events: ScrapedEvent[];
  totalEvents: number;
}

interface SelectedVenue {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

function VenueDropdown({
  selected,
  onSelect,
}: {
  selected: SelectedVenue | null;
  onSelect: (venue: SelectedVenue | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: results, isLoading } = trpc.place.searchPlaces.useQuery(
    { query: search, type: "venue" },
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
            Link to a venue (optional)
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

function EventCard({ event }: { event: ScrapedEvent }) {
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
                {format(new Date(event.startAt), "EEE, MMM d yyyy 'at' h:mm a")}
              </span>
              {event.endAt && (
                <span className="text-xs">
                  — {format(new Date(event.endAt), "h:mm a")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {event.visibility}
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
              venueName: <span className="text-foreground">{event.venueName}</span>
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
              endAt: <span className="text-foreground">{event.endAt || "null"}</span>
            </span>
            <span>
              coverImageUrl: <span className="text-foreground">{event.coverImageUrl ? "yes" : "null"}</span>
            </span>
            <span>
              categories: <span className="text-foreground">{JSON.stringify(event.categories)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScrapeClubCafePage() {
  const [url, setUrl] = useState("https://www.clubcafe.com/club-events/");
  const [maxPages, setMaxPages] = useState("3");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<SelectedVenue | null>(
    null
  );
  const { toast } = useToast();

  const batchCreate = trpc.event.batchCreateEvents.useMutation({
    onSuccess: (data) => {
      setImportedCount(data.created);
      toast({
        title: "Events imported",
        description: `${data.created} events added to WIG${selectedVenue ? ` (linked to ${selectedVenue.name})` : ""}`,
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

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImportedCount(null);

    try {
      const response = await fetch("/api/scrape-clubcafe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          maxPages: Number.parseInt(maxPages, 10) || 3,
        }),
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
    if (!result) return;

    const events = result.events.map((event) => ({
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
      categories: event.categories,
      visibility: event.visibility as "public" | "private",
    }));

    batchCreate.mutate({
      venueId: selectedVenue?.id,
      events,
    });
  };

  return (
    <div className="space-y-6">
      <BackButtonHeader
        backHref="/admin"
        title="Club Cafe Scraper (Test)"
        subtitle="Scrape events from Club Cafe and preview schema mapping"
      />

      <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
        <Input
          placeholder="https://www.clubcafe.com/club-events/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleScrape()}
        />
        <Input
          placeholder="Max pages"
          value={maxPages}
          onChange={(e) => setMaxPages(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleScrape()}
        />
        <Button onClick={handleScrape} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Scrape
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                {result.venue.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {result.venue.address && <p>{result.venue.address}</p>}
              <p>
                Parsed → city: <span className="font-medium text-foreground">{result.venue.city}</span>, state: <span className="font-medium text-foreground">{result.venue.state}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Link to venue</p>
                <VenueDropdown
                  selected={selectedVenue}
                  onSelect={setSelectedVenue}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {result.totalEvents} events to import
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
            {result.events.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
