// seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";
import {
  users,
  venues,
  organizers,
  events,
  venueMembers,
  organizerMembers,
  venueFollows,
  organizerFollows,
} from "./schema";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🌱 Seeding database...");

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

  // If returning() yields [] due to conflicts, fall back to known IDs
  const demoUserIds =
    insertedUsers.length > 0
      ? insertedUsers.map((u) => u.id)
      : ["user_demo_1", "user_demo_2", "user_demo_3", "user_demo_4"];

  console.log(`✓ Seeded users (returned: ${insertedUsers.length})`);

  // ---------------------------------------------------------------------------
  // VENUES
  // ---------------------------------------------------------------------------
  console.log("Creating venues...");

  const venueData = [
    // Boston
    {
      slug: "boston-house-of-blues",
      name: "House of Blues Boston",
      description:
        "Iconic live music venue at Lansdowne Street with touring acts and late-night shows.",
      imageUrl: null,
      address: "15 Lansdowne St, Boston, MA 02215",
      city: "Boston",
      state: "MA",
      website: "https://www.houseofblues.com/boston",
      instagram: "houseofbluesboston",
    },
    {
      slug: "royale-boston",
      name: "Royale Boston",
      description:
        "Downtown nightclub and concert venue hosting DJs, dance nights, and special events.",
      imageUrl: null,
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      website: "https://royaleboston.com",
      instagram: "royaleboston",
    },
    {
      slug: "the-sinclair",
      name: "The Sinclair",
      description:
        "Intimate live music venue in Harvard Square featuring indie and electronic acts.",
      imageUrl: null,
      address: "52 Church St, Cambridge, MA 02138",
      city: "Cambridge",
      state: "MA",
      website: "https://www.sinclaircambridge.com",
      instagram: "sinclaircambridge",
    },

    // NYC
    {
      slug: "brooklyn-steel",
      name: "Brooklyn Steel",
      description:
        "Large-scale industrial venue in Williamsburg with top-tier production and major acts.",
      imageUrl: null,
      address: "319 Frost St, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      website: "https://www.bowerypresents.com",
      instagram: "brooklynsteel",
    },
    {
      slug: "elsewhere-brooklyn",
      name: "Elsewhere",
      description:
        "Multi-room club in Brooklyn known for electronic music, rooftop parties, and community vibes.",
      imageUrl: null,
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      website: "https://www.elsewhere.club",
      instagram: "elsewherenyc",
    },
    {
      slug: "terminal-5",
      name: "Terminal 5",
      description:
        "Large Manhattan venue for concerts and special events with multiple viewing levels.",
      imageUrl: null,
      address: "610 W 56th St, New York, NY 10019",
      city: "New York",
      state: "NY",
      website: "https://www.terminal5nyc.com",
      instagram: "terminal5nyc",
    },
  ];

  const createdVenues = await db
    .insert(venues)
    .values(venueData)
    .onConflictDoNothing()
    .returning();

  console.log(`✓ Created ${createdVenues.length} venues`);

  // Helper: find venue IDs by slug from returned rows
  const venueIdBySlug = new Map(createdVenues.map((v) => [v.slug, v.id]));

  // ---------------------------------------------------------------------------
  // ORGANIZERS
  // ---------------------------------------------------------------------------
  console.log("Creating organizers...");

  const organizerData = [
    {
      slug: "midnight-moves",
      name: "Midnight Moves",
      description:
        "Dance-forward parties featuring house, disco, and tasteful late-night energy.",
      imageUrl: null,
      website: "https://midnightmoves.example.com",
      instagram: "midnightmoves",
    },
    {
      slug: "neon-nights-collective",
      name: "Neon Nights Collective",
      description:
        "Electronic events, DJ showcases, and themed club nights across Boston and NYC.",
      imageUrl: null,
      website: "https://neonnights.example.com",
      instagram: "neonnightscollective",
    },
    {
      slug: "taste-of-the-city",
      name: "Taste of the City",
      description:
        "Food + culture pop-ups with tastings, chef collabs, and community hangouts.",
      imageUrl: null,
      website: "https://tasteofthecity.example.com",
      instagram: "tasteofthecity",
    },
    {
      slug: "run-club-social",
      name: "Run Club Social",
      description:
        "Weekly social runs + post-run meetups (coffee, bars, and seasonal specials).",
      imageUrl: null,
      website: "https://runclubsocial.example.com",
      instagram: "runclubsocial",
    },
  ];

  const createdOrganizers = await db
    .insert(organizers)
    .values(organizerData)
    .onConflictDoNothing()
    .returning();

  console.log(`✓ Created ${createdOrganizers.length} organizers`);

  const organizerIdBySlug = new Map(
    createdOrganizers.map((o) => [o.slug, o.id])
  );

  // ---------------------------------------------------------------------------
  // MEMBERSHIPS (optional, but useful for demo data)
  // ---------------------------------------------------------------------------
  console.log("Creating venue & organizer memberships...");

  const u1 = demoUserIds[0] ?? "user_demo_1";
  const u2 = demoUserIds[1] ?? "user_demo_2";
  const u3 = demoUserIds[2] ?? "user_demo_3";
  const u4 = demoUserIds[3] ?? "user_demo_4";

  const membershipVenueRows = [
    // Alice helps run a Boston venue
    {
      userId: u1,
      venueId: venueIdBySlug.get("boston-house-of-blues")!,
    },
    // Charlie helps run Royale
    {
      userId: u3,
      venueId: venueIdBySlug.get("royale-boston")!,
    },
    // Bob helps run Elsewhere
    {
      userId: u2,
      venueId: venueIdBySlug.get("elsewhere-brooklyn")!,
    },
    // Dana helps run Brooklyn Steel
    {
      userId: u4,
      venueId: venueIdBySlug.get("brooklyn-steel")!,
    },
  ].filter((r) => Boolean(r.venueId));

  if (membershipVenueRows.length > 0) {
    await db
      .insert(venueMembers)
      .values(membershipVenueRows)
      .onConflictDoNothing();
  }

  const membershipOrganizerRows = [
    {
      userId: u1,
      organizerId: organizerIdBySlug.get("neon-nights-collective")!,
    },
    { userId: u2, organizerId: organizerIdBySlug.get("midnight-moves")! },
    { userId: u3, organizerId: organizerIdBySlug.get("taste-of-the-city")! },
    { userId: u4, organizerId: organizerIdBySlug.get("run-club-social")! },
  ].filter((r) => Boolean(r.organizerId));

  if (membershipOrganizerRows.length > 0) {
    await db
      .insert(organizerMembers)
      .values(membershipOrganizerRows)
      .onConflictDoNothing();
  }

  // Optional: some follows
  await db
    .insert(venueFollows)
    .values(
      [
        { userId: u1, venueId: venueIdBySlug.get("elsewhere-brooklyn")! },
        { userId: u2, venueId: venueIdBySlug.get("royale-boston")! },
        { userId: u3, venueId: venueIdBySlug.get("terminal-5")! },
        { userId: u4, venueId: venueIdBySlug.get("the-sinclair")! },
      ].filter((r) => Boolean(r.venueId))
    )
    .onConflictDoNothing();

  await db
    .insert(organizerFollows)
    .values(
      [
        { userId: u1, organizerId: organizerIdBySlug.get("midnight-moves")! },
        {
          userId: u2,
          organizerId: organizerIdBySlug.get("taste-of-the-city")!,
        },
        { userId: u3, organizerId: organizerIdBySlug.get("run-club-social")! },
      ].filter((r) => Boolean(r.organizerId))
    )
    .onConflictDoNothing();

  console.log("✓ Created memberships & follows");

  // ---------------------------------------------------------------------------
  // EVENTS (Boston + NYC)
  // ---------------------------------------------------------------------------
  console.log("Creating events...");

  const now = new Date();

  // helper to build start/end
  const daysFromNowAt = (days: number, hour: number, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const hoursAfter = (start: Date, hours: number) =>
    new Date(start.getTime() + hours * 60 * 60 * 1000);

  const eventData = [
    // -------------------
    // Boston / Cambridge
    // -------------------
    {
      venueId: venueIdBySlug.get("boston-house-of-blues") ?? null,
      organizerId: organizerIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u1,
      title: "Neon Nights: House & Disco Showcase",
      description:
        "A late-night blend of house, disco edits, and upbeat grooves. Dress bright, dance harder.",
      imageUrl: null,
      startAt: daysFromNowAt(1, 21, 0),
      endAt: hoursAfter(daysFromNowAt(1, 21, 0), 4),
      venueName: "House of Blues Boston",
      address: "15 Lansdowne St, Boston, MA 02215",
      city: "Boston",
      state: "MA",
      category: "nightlife" as const,
      visibility: "public" as const,
    },
    {
      venueId: venueIdBySlug.get("royale-boston") ?? null,
      organizerId: organizerIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u3,
      title: "Midnight Moves: Classic Club Night",
      description:
        "A proper club night: house classics, peak-time energy, and zero phones on the dancefloor vibes.",
      imageUrl: null,
      startAt: daysFromNowAt(3, 22, 30),
      endAt: hoursAfter(daysFromNowAt(3, 22, 30), 4.5),
      venueName: "Royale",
      address: "279 Tremont St, Boston, MA 02116",
      city: "Boston",
      state: "MA",
      category: "nightlife" as const,
      visibility: "public" as const,
    },
    {
      venueId: venueIdBySlug.get("the-sinclair") ?? null,
      organizerId: null,
      createdByUserId: u1,
      title: "Indie Electronic Live Set + Afterparty",
      description:
        "Live electronic performance followed by a short DJ afterparty. Intimate room, big sound.",
      imageUrl: null,
      startAt: daysFromNowAt(5, 20, 0),
      endAt: hoursAfter(daysFromNowAt(5, 20, 0), 3),
      venueName: "The Sinclair",
      address: "52 Church St, Cambridge, MA 02138",
      city: "Cambridge",
      state: "MA",
      category: "music" as const,
      visibility: "public" as const,
    },
    {
      venueId: null,
      organizerId: organizerIdBySlug.get("run-club-social") ?? null,
      createdByUserId: u3,
      title: "Run Club Social: Esplanade Loop (5K)",
      description:
        "Easy 5K along the Charles with a post-run coffee hang. All paces welcome.",
      imageUrl: null,
      startAt: daysFromNowAt(2, 9, 0),
      endAt: hoursAfter(daysFromNowAt(2, 9, 0), 1.5),
      venueName: "Charles River Esplanade",
      address: "Storrow Dr, Boston, MA",
      city: "Boston",
      state: "MA",
      category: "sports" as const,
      visibility: "public" as const,
    },
    {
      venueId: null,
      organizerId: organizerIdBySlug.get("taste-of-the-city") ?? null,
      createdByUserId: u1,
      title: "Taste of the City: Dumpling Pop-Up",
      description:
        "A casual dumpling + small bites pop-up featuring rotating fillings and sauces. Come hungry.",
      imageUrl: null,
      startAt: daysFromNowAt(6, 18, 0),
      endAt: hoursAfter(daysFromNowAt(6, 18, 0), 2.5),
      venueName: "Downtown Food Hall (Pop-Up)",
      address: "100 Summer St, Boston, MA 02110",
      city: "Boston",
      state: "MA",
      category: "food" as const,
      visibility: "public" as const,
    },

    // ----------
    // NYC
    // ----------
    {
      venueId: venueIdBySlug.get("elsewhere-brooklyn") ?? null,
      organizerId: organizerIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u2,
      title: "Neon Nights NYC: Rooftop Grooves",
      description:
        "Rooftop party with melodic house and feel-good edits. Limited capacity.",
      imageUrl: null,
      startAt: daysFromNowAt(2, 19, 30),
      endAt: hoursAfter(daysFromNowAt(2, 19, 30), 4),
      venueName: "Elsewhere Rooftop",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      category: "nightlife" as const,
      visibility: "public" as const,
    },
    {
      venueId: venueIdBySlug.get("brooklyn-steel") ?? null,
      organizerId: organizerIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u4,
      title: "Midnight Moves Presents: Warehouse House",
      description:
        "Big-room house energy with a stacked lineup of selectors. Expect strong openers.",
      imageUrl: null,
      startAt: daysFromNowAt(4, 21, 0),
      endAt: hoursAfter(daysFromNowAt(4, 21, 0), 5),
      venueName: "Brooklyn Steel",
      address: "319 Frost St, Brooklyn, NY 11222",
      city: "Brooklyn",
      state: "NY",
      category: "music" as const,
      visibility: "public" as const,
    },
    {
      venueId: venueIdBySlug.get("terminal-5") ?? null,
      organizerId: null,
      createdByUserId: u2,
      title: "Dance-Pop Arena Night",
      description:
        "A high-energy dance-pop show with full production and a late closing set.",
      imageUrl: null,
      startAt: daysFromNowAt(7, 20, 0),
      endAt: hoursAfter(daysFromNowAt(7, 20, 0), 3.5),
      venueName: "Terminal 5",
      address: "610 W 56th St, New York, NY 10019",
      city: "New York",
      state: "NY",
      category: "music" as const,
      visibility: "public" as const,
    },
    {
      venueId: null,
      organizerId: organizerIdBySlug.get("run-club-social") ?? null,
      createdByUserId: u4,
      title: "Run Club Social: Williamsburg Bridge Sunset Jog",
      description:
        "Short run with skyline views, followed by a chill hang. Bring layers.",
      imageUrl: null,
      startAt: daysFromNowAt(3, 17, 0),
      endAt: hoursAfter(daysFromNowAt(3, 17, 0), 1.25),
      venueName: "Williamsburg Bridge (Meet-up)",
      address: "Williamsburg Bridge, Brooklyn, NY",
      city: "Brooklyn",
      state: "NY",
      category: "sports" as const,
      visibility: "public" as const,
    },
    {
      venueId: null,
      organizerId: organizerIdBySlug.get("taste-of-the-city") ?? null,
      createdByUserId: u2,
      title: "Taste of the City NYC: Ramen + Vinyl",
      description:
        "Ramen pop-up with a vinyl-only DJ set. Cozy, casual, and delicious.",
      imageUrl: null,
      startAt: daysFromNowAt(1, 18, 30),
      endAt: hoursAfter(daysFromNowAt(1, 18, 30), 2.5),
      venueName: "Lower East Side Pop-Up Space",
      address: "220 E Houston St, New York, NY 10002",
      city: "New York",
      state: "NY",
      category: "food" as const,
      visibility: "public" as const,
    },
    {
      venueId: venueIdBySlug.get("elsewhere-brooklyn") ?? null,
      organizerId: organizerIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u2,
      title: "All-Night DJ Relay",
      description:
        "Four DJs, one room, no breaks. Rotating styles from deep to peak-time.",
      imageUrl: null,
      startAt: daysFromNowAt(6, 23, 0),
      endAt: hoursAfter(daysFromNowAt(6, 23, 0), 5),
      venueName: "Elsewhere - Main Room",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      category: "nightlife" as const,
      visibility: "public" as const,
    },

    // New test events: same-city, same-day overlaps
    {
      // Boston: same day as "Neon Nights: House & Disco Showcase" (daysFromNowAt(1,...))
      venueId: venueIdBySlug.get("boston-house-of-blues") ?? null,
      organizerId: organizerIdBySlug.get("midnight-moves") ?? null,
      createdByUserId: u3,
      title: "Boston Pre-Party: Local DJ Warmup",
      description:
        "Early warmup with local DJs before the main Neon Nights event — come early for drinks and tunes.",
      imageUrl: null,
      startAt: daysFromNowAt(1, 19, 0),
      endAt: hoursAfter(daysFromNowAt(1, 19, 0), 2),
      venueName: "House of Blues Boston - Bar Room",
      address: "15 Lansdowne St, Boston, MA 02215",
      city: "Boston",
      state: "MA",
      category: "nightlife" as const,
      visibility: "public" as const,
    },
    {
      // Boston: same day as Run Club (daysFromNowAt(2,...))
      venueId: null,
      organizerId: organizerIdBySlug.get("taste-of-the-city") ?? null,
      createdByUserId: u1,
      title: "Post-Run Coffee & Stretch",
      description:
        "Light cooldown and coffee meetup after the Run Club Social 5K — informal and free.",
      imageUrl: null,
      startAt: daysFromNowAt(2, 10, 30),
      endAt: hoursAfter(daysFromNowAt(2, 10, 30), 0.75),
      venueName: "Esplanade Lawn",
      address: "Storrow Dr, Boston, MA",
      city: "Boston",
      state: "MA",
      category: "sports" as const,
      visibility: "public" as const,
    },

    // NYC / Brooklyn: same day as Elsewhere Rooftop Neon Nights (daysFromNowAt(2,...))
    {
      venueId: venueIdBySlug.get("elsewhere-brooklyn") ?? null,
      organizerId: organizerIdBySlug.get("neon-nights-collective") ?? null,
      createdByUserId: u2,
      title: "Brooklyn Warmup: Sunset Vinyl Sets",
      description:
        "Sunset vinyl warmup on the rooftop ahead of the main Neon Nights rooftop party.",
      imageUrl: null,
      startAt: daysFromNowAt(2, 18, 0),
      endAt: hoursAfter(daysFromNowAt(2, 18, 0), 1.5),
      venueName: "Elsewhere Rooftop",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      category: "music" as const,
      visibility: "public" as const,
    },
    {
      // Brooklyn: overlaps the All-Night DJ Relay (daysFromNowAt(6,...))
      venueId: venueIdBySlug.get("elsewhere-brooklyn") ?? null,
      organizerId: null,
      createdByUserId: u4,
      title: "Basement Bangers",
      description:
        "Late-night basement party with tight selectors — overlaps the all-night relay upstairs.",
      imageUrl: null,
      startAt: daysFromNowAt(6, 22, 30),
      endAt: hoursAfter(daysFromNowAt(6, 22, 30), 4),
      venueName: "Elsewhere - Basement",
      address: "599 Johnson Ave, Brooklyn, NY 11237",
      city: "Brooklyn",
      state: "NY",
      category: "nightlife" as const,
      visibility: "public" as const,
    },
    {
      // Manhattan / New York: same day as "Taste of the City NYC: Ramen + Vinyl" (daysFromNowAt(1,...))
      venueId: null,
      organizerId: organizerIdBySlug.get("taste-of-the-city") ?? null,
      createdByUserId: u2,
      title: "Lower East Side Vinyl Market",
      description:
        "Vinyl sellers and a DJ set in the lot — runs earlier the same evening as the Ramen + Vinyl pop-up.",
      imageUrl: null,
      startAt: daysFromNowAt(1, 17, 0),
      endAt: hoursAfter(daysFromNowAt(1, 17, 0), 2),
      venueName: "LES Pop-Up Lot",
      address: "220 E Houston St, New York, NY 10002",
      city: "New York",
      state: "NY",
      category: "food" as const,
      visibility: "public" as const,
    },
  ];

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
