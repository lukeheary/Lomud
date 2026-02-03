// seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";
import {
  users,
  cities,
  places,
  events,
  placeMembers,
  placeFollows,
  activityEvents,
} from "./schema";
import { inArray } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🌱 Seeding database...");

  // ---------------------------------------------------------------------------
  // CLEAR (places, events) + their dependent join rows
  // ---------------------------------------------------------------------------
  console.log("🧹 Clearing existing place/event data...");

  // Delete dependents first to avoid FK violations
  await db.delete(placeMembers);
  await db.delete(placeFollows);
  await db.delete(activityEvents);

  // Then core tables
  await db.delete(events);
  await db.delete(cities);
  await db.delete(places);

  console.log("✓ Cleared places, events (and related join tables)");

  // ---------------------------------------------------------------------------
  // USERS (demo records; in prod you'd create via Clerk webhook)
  // ---------------------------------------------------------------------------
  console.log("Creating demo users...");

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        id: "user_demo_1",
        email: "alice@example.com",
        username: "alice_demo",
        firstName: "Alice",
        lastName: "Johnson",
        imageUrl: null,
        city: "Boston",
        state: "MA",
      },
      {
        id: "user_demo_2",
        email: "bob@example.com",
        username: "bob_demo",
        firstName: "Bob",
        lastName: "Smith",
        imageUrl: null,
        city: "New York",
        state: "NY",
      },
      {
        id: "user_demo_3",
        email: "charlie@example.com",
        username: "charlie_demo",
        firstName: "Charlie",
        lastName: "Davis",
        imageUrl: null,
        city: "Boston",
        state: "MA",
      },
      {
        id: "user_demo_4",
        email: "dana@example.com",
        username: "dana_demo",
        firstName: "Dana",
        lastName: "Lee",
        imageUrl: null,
        city: "New York",
        state: "NY",
      },
    ])
    .onConflictDoNothing()
    .returning();

  const demoUserIds =
    insertedUsers.length > 0
      ? insertedUsers.map((u) => u.id)
      : ["user_demo_1", "user_demo_2", "user_demo_3", "user_demo_4"];

  console.log(`✓ Seeded users (returned: ${insertedUsers.length})`);

  // ---------------------------------------------------------------------------
  // CITIES (for distance-based filtering)
  // ---------------------------------------------------------------------------
  console.log("Creating cities...");

  const cityData = [
    { name: "Boston", state: "MA", latitude: 42.3601, longitude: -71.0589 },
    { name: "Cambridge", state: "MA", latitude: 42.3736, longitude: -71.1097 },
    { name: "Brooklyn", state: "NY", latitude: 40.6782, longitude: -73.9442 },
    { name: "New York", state: "NY", latitude: 40.7128, longitude: -74.006 },
  ];

  await db.insert(cities).values(cityData).onConflictDoNothing();

  console.log(`✓ Seeded cities (${cityData.length})`);

  // ---------------------------------------------------------------------------
  // PLACES (venues and organizers combined)
  // ---------------------------------------------------------------------------
  console.log("Creating places (venues and organizers)...");

  const placeData = [
    // VENUES (Boston)
    {
      type: "venue" as const,
      slug: "royale-boston",
      name: "Royale Boston",
      description:
        "Downtown nightclub with touring DJs, themed parties, and big-room energy.",
      imageUrl: null,
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      website: "https://royaleboston.com",
      instagram: "royaleboston",
      categories: ["clubs", "concerts"],
      hours: {
        monday: { open: "22:00", close: "02:00", closed: true },
        tuesday: { open: "22:00", close: "02:00", closed: true },
        wednesday: { open: "22:00", close: "02:00", closed: false },
        thursday: { open: "22:00", close: "02:00", closed: false },
        friday: { open: "22:00", close: "03:00", closed: false },
        saturday: { open: "22:00", close: "03:00", closed: false },
        sunday: { open: "22:00", close: "02:00", closed: true },
      },
    },
    {
      type: "venue" as const,
      slug: "bijou-boston",
      name: "Bijou Boston",
      description:
        "Basement club lounge known for house nights, bottle service, and late sets.",
      imageUrl: null,
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      website: null,
      instagram: null,
      categories: ["clubs", "bars"],
      hours: {
        monday: { open: "21:00", close: "02:00", closed: true },
        tuesday: { open: "21:00", close: "02:00", closed: true },
        wednesday: { open: "21:00", close: "02:00", closed: true },
        thursday: { open: "21:00", close: "02:00", closed: false },
        friday: { open: "21:00", close: "03:00", closed: false },
        saturday: { open: "21:00", close: "03:00", closed: false },
        sunday: { open: "21:00", close: "02:00", closed: false },
      },
    },
    {
      type: "venue" as const,
      slug: "middlesex-lounge-cambridge",
      name: "The Middlesex Lounge",
      description:
        "Cambridge spot with dance nights, DJ lineups, and a cozy late-night floor.",
      imageUrl: null,
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      website: null,
      instagram: null,
      categories: ["bars", "lgbt"],
      hours: {
        monday: { open: "17:00", close: "01:00", closed: true },
        tuesday: { open: "17:00", close: "01:00", closed: false },
        wednesday: { open: "17:00", close: "01:00", closed: false },
        thursday: { open: "17:00", close: "01:00", closed: false },
        friday: { open: "17:00", close: "02:00", closed: false },
        saturday: { open: "17:00", close: "02:00", closed: false },
        sunday: { open: "17:00", close: "01:00", closed: false },
      },
    },

    // VENUES (NYC)
    {
      type: "venue" as const,
      slug: "elsewhere-brooklyn",
      name: "Elsewhere",
      description:
        "Multi-room Brooklyn club with electronic nights, rooftop parties, and community vibes.",
      imageUrl: null,
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      website: "https://www.elsewhere.club",
      instagram: "elsewherenyc",
      categories: ["clubs", "concerts", "social"],
      hours: {
        monday: { open: "19:00", close: "02:00", closed: true },
        tuesday: { open: "19:00", close: "02:00", closed: true },
        wednesday: { open: "19:00", close: "02:00", closed: false },
        thursday: { open: "19:00", close: "02:00", closed: false },
        friday: { open: "19:00", close: "04:00", closed: false },
        saturday: { open: "19:00", close: "04:00", closed: false },
        sunday: { open: "19:00", close: "02:00", closed: false },
      },
    },
    {
      type: "venue" as const,
      slug: "good-room-brooklyn",
      name: "Good Room",
      description:
        "Beloved Brooklyn club with deep house, disco, and all-night dance floor energy.",
      imageUrl: null,
      address: "98 Meserole Ave, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      website: null,
      instagram: null,
      categories: ["clubs", "lgbt"],
      hours: {
        monday: { open: "20:00", close: "04:00", closed: true },
        tuesday: { open: "20:00", close: "04:00", closed: true },
        wednesday: { open: "20:00", close: "04:00", closed: true },
        thursday: { open: "20:00", close: "04:00", closed: false },
        friday: { open: "20:00", close: "04:00", closed: false },
        saturday: { open: "20:00", close: "04:00", closed: false },
        sunday: { open: "20:00", close: "04:00", closed: false },
      },
    },

    // ORGANIZERS
    {
      type: "organizer" as const,
      slug: "midnight-moves",
      name: "Midnight Moves",
      description:
        "Dance-forward parties featuring house, disco, and tasteful late-night energy.",
      imageUrl: null,
      city: null,
      state: null,
      website: "https://midnightmoves.example.com",
      instagram: "midnightmoves",
    },
    {
      type: "organizer" as const,
      slug: "neon-nights-collective",
      name: "Neon Nights Collective",
      description:
        "Electronic parties, DJ showcases, and themed club nights across Boston and NYC.",
      imageUrl: null,
      city: null,
      state: null,
      website: "https://neonnights.example.com",
      instagram: "neonnightscollective",
    },
    {
      type: "organizer" as const,
      slug: "afterhours-society",
      name: "AfterHours Society",
      description:
        "Late-night DJ-driven events focused on underground house and techno.",
      imageUrl: null,
      city: null,
      state: null,
      website: "https://afterhours.example.com",
      instagram: "afterhourssociety",
    },
    {
      type: "organizer" as const,
      slug: "rooftop-rituals",
      name: "Rooftop Rituals",
      description:
        "Seasonal rooftop parties with groove-forward lineups and sunset sets.",
      imageUrl: null,
      city: null,
      state: null,
      website: "https://rooftoprituals.example.com",
      instagram: "rooftoprituals",
    },
  ];

  await db.insert(places).values(placeData).onConflictDoNothing();

  const placeRows = await db
    .select({ id: places.id, slug: places.slug, type: places.type })
    .from(places)
    .where(
      inArray(
        places.slug,
        placeData.map((p) => p.slug)
      )
    );

  const placeIdBySlug = new Map(placeRows.map((p) => [p.slug, p.id]));

  const missingSlugs = placeData
    .map((p) => p.slug)
    .filter((s) => !placeIdBySlug.get(s));
  if (missingSlugs.length > 0) {
    throw new Error(`Missing place IDs for slugs: ${missingSlugs.join(", ")}`);
  }

  console.log(`✓ Ensured ${placeRows.length} places exist`);

  // ---------------------------------------------------------------------------
  // MEMBERSHIPS (optional, but useful for demo data)
  // ---------------------------------------------------------------------------
  console.log("Creating place memberships...");

  const u1 = demoUserIds[0] ?? "user_demo_1";
  const u2 = demoUserIds[1] ?? "user_demo_2";
  const u3 = demoUserIds[2] ?? "user_demo_3";
  const u4 = demoUserIds[3] ?? "user_demo_4";

  // Venue memberships
  await db
    .insert(placeMembers)
    .values([
      { userId: u1, placeId: placeIdBySlug.get("royale-boston")! },
      { userId: u3, placeId: placeIdBySlug.get("bijou-boston")! },
      { userId: u2, placeId: placeIdBySlug.get("elsewhere-brooklyn")! },
      { userId: u4, placeId: placeIdBySlug.get("good-room-brooklyn")! },
    ])
    .onConflictDoNothing();

  // Organizer memberships
  await db
    .insert(placeMembers)
    .values([
      { userId: u1, placeId: placeIdBySlug.get("neon-nights-collective")! },
      { userId: u2, placeId: placeIdBySlug.get("midnight-moves")! },
      { userId: u3, placeId: placeIdBySlug.get("afterhours-society")! },
      { userId: u4, placeId: placeIdBySlug.get("rooftop-rituals")! },
    ])
    .onConflictDoNothing();

  // Place follows
  await db
    .insert(placeFollows)
    .values([
      { userId: u1, placeId: placeIdBySlug.get("elsewhere-brooklyn")! },
      { userId: u2, placeId: placeIdBySlug.get("royale-boston")! },
      { userId: u3, placeId: placeIdBySlug.get("bijou-boston")! },
      { userId: u4, placeId: placeIdBySlug.get("good-room-brooklyn")! },
      { userId: u1, placeId: placeIdBySlug.get("midnight-moves")! },
      { userId: u2, placeId: placeIdBySlug.get("afterhours-society")! },
      { userId: u3, placeId: placeIdBySlug.get("neon-nights-collective")! },
    ])
    .onConflictDoNothing();

  console.log("✓ Created memberships & follows");

  // ---------------------------------------------------------------------------
  // EVENTS — venueId is NEVER null
  // start/end are always based on "today" at runtime (not hard-coded dates)
  // ---------------------------------------------------------------------------
  console.log("Creating events...");

  // Anchor to start-of-today so reruns later in the day don't shift times.
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const daysFromTodayAt = (days: number, hour: number, minute = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const hoursAfter = (start: Date, hours: number) =>
    new Date(start.getTime() + hours * 60 * 60 * 1000);

  const eventData = [
    // -------------------
    // Boston
    // -------------------
    {
      venueId: placeIdBySlug.get("royale-boston")!,
      organizerId: placeIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u1,
      title: "Neon Nights: Royale Takeover",
      description:
        "House + disco all night in the main room. Bright fits encouraged; phone-light moments discouraged.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 22, 0),
      endAt: hoursAfter(daysFromTodayAt(1, 22, 0), 4.5),
      venueName: "Royale Boston",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs", "concerts"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("bijou-boston")!,
      organizerId: placeIdBySlug.get("afterhours-society") ?? null,
      createdByUserId: u3,
      title: "AfterHours: Basement House Session",
      description:
        "Low ceilings, deep grooves. Underground house selectors from open to close.",
      imageUrl: null,
      startAt: daysFromTodayAt(2, 23, 0),
      endAt: hoursAfter(daysFromTodayAt(2, 23, 0), 5),
      venueName: "Bijou Boston",
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("middlesex-lounge-cambridge")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u3,
      title: "Middlesex: Disco Warmup + Late House",
      description:
        "Disco warmup into late house heaters. Smaller room, louder singalongs.",
      imageUrl: null,
      startAt: daysFromTodayAt(6, 21, 0),
      endAt: hoursAfter(daysFromTodayAt(6, 21, 0), 4),
      venueName: "The Middlesex Lounge",
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      categories: ["bars", "lgbt"],
      visibility: "public" as const,
    },

    // Boston overlaps / test density
    {
      venueId: placeIdBySlug.get("royale-boston")!,
      organizerId: placeIdBySlug.get("afterhours-society") ?? null,
      createdByUserId: u3,
      title: "Royale Side Room: Tech House Hour",
      description:
        "Early side-room warmup: rolling tech house and quick transitions before the main takeover.",
      imageUrl: null,
      startAt: daysFromTodayAt(1, 20, 30),
      endAt: hoursAfter(daysFromTodayAt(1, 20, 30), 2),
      venueName: "Royale Boston (Side Room)",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("bijou-boston")!,
      organizerId: null,
      createdByUserId: u1,
      title: "Guest List Thursdays: Local Selectors",
      description:
        "Local DJ rotation with drink specials. Casual, packed, and unapologetically fun.",
      imageUrl: null,
      startAt: daysFromTodayAt(3, 22, 0),
      endAt: hoursAfter(daysFromTodayAt(3, 22, 0), 3.5),
      venueName: "Bijou Boston",
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["bars", "social"],
      visibility: "public" as const,
    },

    // Additional Boston Events (Days 0-7)
    {
      venueId: placeIdBySlug.get("royale-boston")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u1,
      title: "Midnight Moves: Opening Night",
      description:
        "Season kickoff with extended sets and special guests. Funky house meets soulful disco.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 21, 0),
      endAt: hoursAfter(daysFromTodayAt(0, 21, 0), 5),
      venueName: "Royale Boston",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs", "concerts"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("middlesex-lounge-cambridge")!,
      organizerId: null,
      createdByUserId: u3,
      title: "Sunday Sessions: Chill Vibes & Vinyl",
      description:
        "Sunday afternoon hangout with vinyl selections, craft cocktails, and good conversation.",
      imageUrl: null,
      startAt: daysFromTodayAt(1, 16, 0),
      endAt: hoursAfter(daysFromTodayAt(1, 16, 0), 4),
      venueName: "The Middlesex Lounge",
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      categories: ["bars", "social"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("bijou-boston")!,
      organizerId: placeIdBySlug.get("rooftop-rituals") ?? null,
      createdByUserId: u1,
      title: "Rooftop Rituals: Boston Underground",
      description:
        "Deep techno and minimal grooves in the basement. Intimate crowd, heavy sound system.",
      imageUrl: null,
      startAt: daysFromTodayAt(2, 22, 30),
      endAt: hoursAfter(daysFromTodayAt(2, 22, 30), 4),
      venueName: "Bijou Boston",
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("royale-boston")!,
      organizerId: placeIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u1,
      title: "Neon Nights: Throwback Thursday",
      description:
        "2000s dance classics meet modern house remixes. Nostalgia with a twist.",
      imageUrl: null,
      startAt: daysFromTodayAt(3, 21, 30),
      endAt: hoursAfter(daysFromTodayAt(3, 21, 30), 4),
      venueName: "Royale Boston",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs", "concerts"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("middlesex-lounge-cambridge")!,
      organizerId: placeIdBySlug.get("afterhours-society") ?? null,
      createdByUserId: u3,
      title: "AfterHours: Cambridge Edition",
      description:
        "Underground house and techno takeover. Dark room, loud speakers, no phone policy.",
      imageUrl: null,
      startAt: daysFromTodayAt(4, 23, 0),
      endAt: hoursAfter(daysFromTodayAt(4, 23, 0), 4),
      venueName: "The Middlesex Lounge",
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      categories: ["clubs", "lgbt"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("bijou-boston")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u1,
      title: "Midnight Moves: Friday Groove Session",
      description:
        "Classic disco meets modern house. Dance floor therapy with your favorite people.",
      imageUrl: null,
      startAt: daysFromTodayAt(5, 22, 0),
      endAt: hoursAfter(daysFromTodayAt(5, 22, 0), 5),
      venueName: "Bijou Boston",
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs", "bars"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("royale-boston")!,
      organizerId: null,
      createdByUserId: u3,
      title: "Saturday Night Live: Open Format",
      description:
        "Hip-hop, R&B, top 40, and dance hits. Bottle service available, dress code enforced.",
      imageUrl: null,
      startAt: daysFromTodayAt(6, 23, 0),
      endAt: hoursAfter(daysFromTodayAt(6, 23, 0), 4),
      venueName: "Royale Boston",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["clubs", "social"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("middlesex-lounge-cambridge")!,
      organizerId: placeIdBySlug.get("rooftop-rituals") ?? null,
      createdByUserId: u3,
      title: "Rooftop Rituals: Sunday Wind Down",
      description:
        "Mellow house and downtempo to close out the weekend. Good vibes only.",
      imageUrl: null,
      startAt: daysFromTodayAt(7, 19, 0),
      endAt: hoursAfter(daysFromTodayAt(7, 19, 0), 4),
      venueName: "The Middlesex Lounge",
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      categories: ["bars", "social"],
      visibility: "public" as const,
    },

    // Additional Day 0 events for density
    {
      venueId: placeIdBySlug.get("bijou-boston")!,
      organizerId: null,
      createdByUserId: u3,
      title: "Bijou Happy Hour: House Warmup",
      description:
        "Pre-game with groovy house and drink specials. Perfect start before the bigger parties.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 18, 0),
      endAt: hoursAfter(daysFromTodayAt(0, 18, 0), 3),
      venueName: "Bijou Boston",
      address: "51 Stuart St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      categories: ["bars", "social"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("middlesex-lounge-cambridge")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u3,
      title: "Midnight Moves: Cambridge Kickoff",
      description:
        "Disco and funk to start your night right. Early vibes, late energy.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 19, 30),
      endAt: hoursAfter(daysFromTodayAt(0, 19, 30), 4),
      venueName: "The Middlesex Lounge",
      address: "14 Massachusetts Ave, Cambridge, MA 02139",
      city: "Cambridge",
      state: "MA",
      categories: ["bars", "lgbt"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("elsewhere-brooklyn")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u2,
      title: "Midnight Moves: Brooklyn Opening Party",
      description:
        "Multi-room house and disco party. Rooftop, zone one, and dance floor all going off.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 20, 0),
      endAt: hoursAfter(daysFromTodayAt(0, 20, 0), 6),
      venueName: "Elsewhere",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      categories: ["clubs", "concerts"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("good-room-brooklyn")!,
      organizerId: placeIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u4,
      title: "Neon Nights: Brooklyn Deep House Session",
      description:
        "Classic Good Room vibes: deep house, warm crowd, and all-night energy.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 23, 0),
      endAt: hoursAfter(daysFromTodayAt(0, 23, 0), 5),
      venueName: "Good Room",
      address: "98 Meserole Ave, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      categories: ["clubs", "lgbt"],
      visibility: "public" as const,
    },

    // ----------
    // NYC / Brooklyn
    // ----------
    {
      venueId: placeIdBySlug.get("elsewhere-brooklyn")!,
      organizerId: placeIdBySlug.get("rooftop-rituals") ?? null,
      createdByUserId: u2,
      title: "Rooftop Rituals: Sunset Grooves",
      description:
        "Rooftop sets from golden hour into nightfall. Melodic house, disco edits, and good energy.",
      imageUrl: null,
      startAt: daysFromTodayAt(2, 17, 30),
      endAt: hoursAfter(daysFromTodayAt(1, 17, 30), 4),
      venueName: "Elsewhere (Rooftop)",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      categories: ["social", "clubs"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("good-room-brooklyn")!,
      organizerId: placeIdBySlug.get("afterhours-society") ?? null,
      createdByUserId: u4,
      title: "Good Room: All-Night House Marathon",
      description:
        "One room, no breaks. Deep-to-peak house progression with late-night surprises.",
      imageUrl: null,
      startAt: daysFromTodayAt(2, 23, 30),
      endAt: hoursAfter(daysFromTodayAt(2, 23, 30), 6),
      venueName: "Good Room",
      address: "98 Meserole Ave, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      categories: ["clubs", "lgbt"],
      visibility: "public" as const,
    },

    // NYC test density / overlaps
    {
      venueId: placeIdBySlug.get("elsewhere-brooklyn")!,
      organizerId: placeIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u2,
      title: "Elsewhere Warmup: Vinyl-Only Hour",
      description:
        "Early rooftop warmup before the main party. Vinyl-only, groovy, and laid back.",
      imageUrl: null,
      startAt: daysFromTodayAt(0, 16, 0),
      endAt: hoursAfter(daysFromTodayAt(1, 16, 0), 1.5),
      venueName: "Elsewhere (Rooftop)",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      categories: ["concerts"],
      visibility: "public" as const,
    },
    {
      venueId: placeIdBySlug.get("good-room-brooklyn")!,
      organizerId: placeIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u4,
      title: "Good Room (Front Bar): Disco Happy Hour",
      description:
        "Disco and funk to start the night before the marathon kicks off. Come early, leave sweaty.",
      imageUrl: null,
      startAt: daysFromTodayAt(2, 20, 0),
      endAt: hoursAfter(daysFromTodayAt(2, 20, 0), 3),
      venueName: "Good Room (Front Bar)",
      address: "98 Meserole Ave, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      categories: ["bars"],
      visibility: "public" as const,
    },
  ];

  const invalidEvents = eventData.filter((e) => !e.venueId);
  if (invalidEvents.length > 0) {
    throw new Error(
      `Found events with null/undefined venueId: ${invalidEvents
        .map((e) => e.title)
        .join(", ")}`
    );
  }

  const createdEvents = await db
    .insert(events)
    .values(eventData)
    .onConflictDoNothing()
    .returning();

  console.log(`✓ Created ${createdEvents.length} events`);

  console.log("✅ Seeding complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seeding failed:");
  console.error(err);
  process.exit(1);
});
