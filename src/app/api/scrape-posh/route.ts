import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface PoshJsonLd {
  "@type": string;
  name?: string;
  startDate?: string;
  endDate?: string;
  eventStatus?: string;
  url?: string;
  description?: string;
  image?: string | string[];
  organizer?: {
    "@type": string;
    name?: string;
    url?: string;
  };
  location?: {
    "@type": string;
    name?: string;
    address?: {
      "@type": string;
      streetAddress?: string;
    };
    geo?: {
      latitude?: number;
      longitude?: number;
    };
  };
}

function parseAddress(fullAddress: string): {
  address: string;
  city: string;
  state: string;
} {
  // "1 E Pier Dr, East Boston, MA 02128, USA"
  // "60 State St, Boston, MA 02109"
  const parts = fullAddress.split(",").map((s) => s.trim());

  if (parts.length >= 3) {
    // Try to find state from parts like "MA 02128" or "MA"
    for (let i = parts.length - 1; i >= 1; i--) {
      const stateMatch = parts[i].match(/^([A-Z]{2})(?:\s+\d{5})?$/);
      if (stateMatch) {
        const state = stateMatch[1];
        const city = parts[i - 1]?.trim() || "";
        const streetParts = parts.slice(0, i - 1);
        return {
          address: streetParts.join(", ").trim() || fullAddress,
          city: city || "Boston",
          state,
        };
      }
    }
  }

  // Fallback: try regex for "City, ST ZIP"
  const match = fullAddress.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d{0,5}/);
  if (match) {
    return {
      address: fullAddress.split(",")[0]?.trim() || fullAddress,
      city: match[1].trim(),
      state: match[2],
    };
  }

  return { address: fullAddress, city: "Boston", state: "MA" };
}

function extractEventFromJsonLd(jsonLd: PoshJsonLd, eventUrl: string) {
  const imageUrl = Array.isArray(jsonLd.image)
    ? jsonLd.image[0]
    : jsonLd.image || null;

  // Clean up posh CDN image URL - extract the original S3 URL or use as-is
  let coverImageUrl = imageUrl;
  if (coverImageUrl?.includes("/cdn-cgi/image/")) {
    // Extract the original image URL after the CDN transform params
    // e.g. https://posh.vip/cdn-cgi/image/width=1200,.../https://posh-images-...s3.amazonaws.com/...
    const s3Match = coverImageUrl.match(/(https:\/\/posh-images[^"'\s]+)/);
    if (s3Match) {
      coverImageUrl = s3Match[1];
    }
  }

  const fullAddress =
    jsonLd.location?.address?.streetAddress || "";
  const { address, city, state } = parseAddress(fullAddress);

  // Extract external ID from the event URL slug
  const urlSlug = eventUrl
    .replace(/\/$/, "")
    .split("/")
    .pop();

  return {
    title: jsonLd.name || "Untitled Event",
    description: jsonLd.description || null,
    coverImageUrl,
    eventUrl,
    externalId: urlSlug ? `posh-${urlSlug}` : null,
    startAt: jsonLd.startDate || null,
    endAt: jsonLd.endDate || null,
    venueName: jsonLd.location?.name || "",
    address,
    city,
    state,
    categories: ["nightlife"],
    visibility: "public" as const,
    source: "posh" as const,
    eventStatus: "EventScheduled",
    organizerName: jsonLd.organizer?.name || null,
    organizerUrl: jsonLd.organizer?.url || null,
  };
}

async function scrapeEventPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Try the specific script tag first
  let jsonLdScript = $("#event-page-google-script").html();

  // Fallback: look for any application/ld+json script with Event type
  if (!jsonLdScript) {
    $('script[type="application/ld+json"]').each((_, el) => {
      const content = $(el).html();
      if (content && content.includes('"@type":"Event"')) {
        jsonLdScript = content;
        return false; // break
      }
    });
  }

  if (!jsonLdScript) {
    throw new Error(`No JSON-LD event data found on ${url}`);
  }

  const jsonLd: PoshJsonLd = JSON.parse(jsonLdScript);
  return extractEventFromJsonLd(jsonLd, url);
}

async function discoverEventUrls(groupUrl: string): Promise<string[]> {
  const response = await fetch(groupUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch group page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Look for links to individual event pages
  const urls = new Set<string>();
  $('a[href*="/e/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      const fullUrl = href.startsWith("http")
        ? href
        : `https://posh.vip${href}`;
      if (fullUrl.includes("posh.vip/e/")) {
        urls.add(fullUrl);
      }
    }
  });

  return Array.from(urls);
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = (await request.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of Posh event URLs" },
        { status: 400 }
      );
    }

    // Separate group URLs from event URLs
    const eventUrls: string[] = [];
    const groupUrls: string[] = [];

    for (const url of urls) {
      const cleaned = url.trim();
      if (!cleaned) continue;
      if (!cleaned.includes("posh.vip")) {
        return NextResponse.json(
          { error: `Invalid URL: ${cleaned}. Must be a posh.vip URL.` },
          { status: 400 }
        );
      }
      if (cleaned.includes("/g/")) {
        groupUrls.push(cleaned);
      } else if (cleaned.includes("/e/")) {
        eventUrls.push(cleaned);
      }
    }

    // Try to discover event URLs from group pages
    for (const groupUrl of groupUrls) {
      try {
        const discovered = await discoverEventUrls(groupUrl);
        eventUrls.push(...discovered);
      } catch {
        // Group pages are client-rendered, discovery may not work
        // That's OK, we just won't add any from this group
      }
    }

    if (eventUrls.length === 0) {
      return NextResponse.json(
        {
          error:
            "No event URLs found. Posh group pages load events client-side, so please paste individual event URLs (posh.vip/e/...) directly.",
        },
        { status: 400 }
      );
    }

    // Deduplicate
    const uniqueUrls = [...new Set(eventUrls)];

    // Scrape each event page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = [];
    const errors: { url: string; error: string }[] = [];

    // Process in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((url) => scrapeEventPage(url))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          events.push(result.value);
        } else {
          errors.push({
            url: batch[j],
            error: result.reason?.message || "Unknown error",
          });
        }
      }
    }

    if (events.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to scrape any events",
          details: errors,
        },
        { status: 404 }
      );
    }

    // Extract organizer info from first event
    const organizer = events[0]?.organizerName
      ? {
          name: events[0].organizerName,
          url: events[0].organizerUrl,
        }
      : null;

    return NextResponse.json({
      organizer,
      events,
      totalEvents: events.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
