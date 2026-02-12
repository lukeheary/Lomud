import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Parse a date label like "Fri 20 Feb" and a time like "8:00 pm"
 * into a full Date object. Resolves year automatically.
 */
function parseDateTime(dateLabel: string, timeStr: string): Date | null {
  // dateLabel: "Fri 20 Feb" or "Thu 6 Mar"
  const dateParts = dateLabel.trim().split(/\s+/);
  if (dateParts.length < 3) return null;

  const day = parseInt(dateParts[1], 10);
  const monthStr = dateParts[2];
  const month = MONTHS[monthStr];
  if (month === undefined || isNaN(day)) return null;

  // Parse time: "8:00 pm" or "10:00 am"
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3].toLowerCase();

  if (ampm === "pm" && hours !== 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  // Resolve year: try current year first, if >30 days in the past use next year
  const now = new Date();
  const currentYear = now.getFullYear();
  let date = new Date(currentYear, month, day, hours, minutes);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (date < thirtyDaysAgo) {
    date = new Date(currentYear + 1, month, day, hours, minutes);
  }

  return date;
}

function parseAddress(address: string): { city: string; state: string } {
  // "209 Columbus Avenue, Boston, MA 02116"
  const parts = address.split(",").map((s) => s.trim());

  if (parts.length >= 3) {
    const city = parts[parts.length - 2]?.trim() || "";
    // Last part might be "MA 02116"
    const stateZipPart = parts[parts.length - 1]?.trim() || "";
    const stateMatch = stateZipPart.match(/^([A-Z]{2})/);
    if (stateMatch && city) {
      return { city, state: stateMatch[1] };
    }
  }

  // Fallback: try to find state code pattern
  const match = address.match(/\b([A-Z]{2})\s+\d{5}\b/);
  return {
    city: parts.length >= 2 ? parts[parts.length - 2]?.trim() || "Boston" : "Boston",
    state: match ? match[1] : "MA",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEventsFromHtml($: cheerio.CheerioAPI): any[] {
  const events: any[] = [];

  $("article.mec-event-article").each((_, article) => {
    const $article = $(article);

    // Title & URL
    const titleLink = $article.find("h3.mec-event-title a").first();
    const title = titleLink.text().trim();
    const eventUrl = titleLink.attr("href") || null;

    // External ID
    const externalId =
      titleLink.attr("data-event-id") ||
      $article.find("a[data-event-id]").first().attr("data-event-id") ||
      null;

    // Cover image
    const coverImageUrl =
      $article.find(".mec-event-image img").attr("src") || null;

    // Description (strip HTML, get text)
    const description =
      $article.find(".mec-event-description").text().trim() || null;

    // Date: "Fri 20 Feb"
    const dateLabel =
      $article.find(".mec-start-date-label").text().trim() || "";

    // Times: "8:00 pm", "10:00 pm"
    const startTimeStr =
      $article.find(".mec-start-time").text().trim() || "";
    const endTimeStr =
      $article.find(".mec-end-time").text().trim() || "";

    // Venue
    const venueName =
      $article.find(".mec-venue-details > span").first().text().trim() ||
      "Club Café Boston";

    // Address
    const address =
      $article.find(".mec-event-address span").text().trim() ||
      "209 Columbus Avenue, Boston, MA 02116";

    // Parse dates
    const startAt = parseDateTime(dateLabel, startTimeStr);
    const endAt = parseDateTime(dateLabel, endTimeStr);

    if (!title || !startAt) return; // skip if we can't get basics

    const { city, state } = parseAddress(address);

    events.push({
      title,
      description,
      coverImageUrl,
      eventUrl,
      externalId: externalId ? `clubcafe-${externalId}` : null,
      startAt: startAt.toISOString(),
      endAt: endAt ? endAt.toISOString() : null,
      venueName,
      address,
      city,
      state,
      categories: ["nightlife"],
      visibility: "public" as const,
      source: "clubcafe" as const,
      eventStatus: "EventScheduled",
    });
  });

  return events;
}

export async function POST(request: NextRequest) {
  try {
    const { url, maxPages = 3 } = await request.json();

    if (!url || !url.startsWith("https://www.clubcafe.com/")) {
      return NextResponse.json(
        {
          error:
            "Invalid URL. Must be a Club Cafe URL (https://www.clubcafe.com/...)",
        },
        { status: 400 }
      );
    }

    const allEvents: any[] = [];
    let currentUrl = url;
    let venueName = "Club Café Boston";
    let venueAddress = "209 Columbus Avenue, Boston, MA 02116";

    for (let page = 0; page < maxPages; page++) {
      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        if (page === 0) {
          return NextResponse.json(
            {
              error: `Failed to fetch page: ${response.status} ${response.statusText}`,
            },
            { status: 502 }
          );
        }
        break; // stop paginating on error for subsequent pages
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageEvents = parseEventsFromHtml($);
      allEvents.push(...pageEvents);

      // Extract venue info from the first event on the first page
      if (page === 0 && pageEvents.length > 0) {
        venueName = pageEvents[0].venueName;
        venueAddress = pageEvents[0].address;
      }

      // Look for next page link
      // MEC plugin pagination: .mec-pagination .mec-next-page a, or numbered pagination
      const nextLink = $(".mec-pagination a.mec-next-page").attr("href") ||
        $(".mec-load-more-button").attr("href");

      if (!nextLink) break;
      currentUrl = nextLink.startsWith("http")
        ? nextLink
        : new URL(nextLink, url).toString();
    }

    if (allEvents.length === 0) {
      return NextResponse.json(
        { error: "No events found on this page" },
        { status: 404 }
      );
    }

    // Deduplicate by externalId
    const seen = new Set<string>();
    const uniqueEvents = allEvents.filter((event) => {
      if (!event.externalId) return true;
      if (seen.has(event.externalId)) return false;
      seen.add(event.externalId);
      return true;
    });

    const { city, state } = parseAddress(venueAddress);

    return NextResponse.json({
      venue: {
        name: venueName,
        address: venueAddress,
        city,
        state,
      },
      events: uniqueEvents,
      totalEvents: uniqueEvents.length,
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
