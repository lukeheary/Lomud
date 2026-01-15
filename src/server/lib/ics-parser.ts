import ICAL from "ical.js";

export type EventCategory =
  | "music"
  | "food"
  | "art"
  | "sports"
  | "community"
  | "nightlife"
  | "other";

// Map ICS categories to your schema
const categoryMap: Record<string, EventCategory> = {
  // Music
  concert: "music",
  music: "music",
  "live music": "music",
  show: "music",
  performance: "music",

  // Food
  food: "food",
  dining: "food",
  restaurant: "food",
  brunch: "food",
  tasting: "food",

  // Art
  art: "art",
  exhibition: "art",
  gallery: "art",
  theater: "art",

  // Sports
  sports: "sports",
  game: "sports",
  athletics: "sports",

  // Community
  community: "community",
  meetup: "community",
  networking: "community",

  // Nightlife
  nightlife: "nightlife",
  party: "nightlife",
  club: "nightlife",
  bar: "nightlife",
};

export function mapCategory(icsCategories?: string | string[]): EventCategory {
  if (!icsCategories) return "other";

  const categories = Array.isArray(icsCategories)
    ? icsCategories
    : [icsCategories];

  for (const cat of categories) {
    const normalized = cat.toLowerCase().trim();
    if (categoryMap[normalized]) {
      return categoryMap[normalized];
    }
  }

  return "other";
}

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  location?: string;
  venueName?: string;
  category: EventCategory;
}

export function parseIcsFile(
  icsText: string,
  defaultCategory: EventCategory = "other"
): ParsedIcsEvent[] {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const events: ParsedIcsEvent[] = [];

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent);

      // Required fields
      const uid = event.uid;
      const title = event.summary;
      const startAt = event.startDate?.toJSDate();

      if (!uid || !title || !startAt) continue;

      // Optional fields
      const endAt = event.endDate?.toJSDate();
      const description = event.description || undefined;
      const location = event.location || undefined;

      // Extract venue name from location
      let venueName: string | undefined;
      if (location) {
        venueName = location.split(/[\n,]/)[0].trim().substring(0, 255);
      }

      // Map category from ICS categories property
      const categories = vevent.getFirstPropertyValue("categories");
      const category = categories ? mapCategory(categories) : defaultCategory;

      events.push({
        uid,
        title: title.substring(0, 255),
        description,
        startAt,
        endAt: endAt || undefined,
        location,
        venueName,
        category,
      });
    } catch (err) {
      // Skip invalid events
      continue;
    }
  }

  return events;
}
