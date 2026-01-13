import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";
import { businesses, events, users } from "./schema";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🌱 Seeding database...");

  // Note: In a real app, users would be created via Clerk webhook
  // For seeding, we'll create demo user records
  console.log("Creating demo users...");

  const demoUsers = await db
    .insert(users)
    .values([
      {
        id: "user_demo_1",
        email: "alice@example.com",
        username: "alice_demo",
        firstName: "Alice",
        lastName: "Johnson",
        imageUrl: null,
      },
      {
        id: "user_demo_2",
        email: "bob@example.com",
        username: "bob_demo",
        firstName: "Bob",
        lastName: "Smith",
        imageUrl: null,
      },
      {
        id: "user_demo_3",
        email: "charlie@example.com",
        username: "charlie_demo",
        firstName: "Charlie",
        lastName: "Davis",
        imageUrl: null,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✓ Created ${demoUsers.length} demo users`);

  // Create businesses
  console.log("Creating businesses...");

  const businessData = [
    {
      slug: "blue-note-jazz",
      name: "Blue Note Jazz Club",
      description:
        "Premier jazz venue featuring live music every night. Intimate setting with world-class performers.",
      city: "San Francisco",
      state: "CA",
      website: "https://bluenotejazz.example.com",
      instagram: "bluenotejazz",
      createdByUserId: demoUsers[0]?.id || "user_demo_1",
    },
    {
      slug: "city-winery",
      name: "City Winery",
      description:
        "Urban winery, restaurant, and live music venue. Great food, wine, and entertainment.",
      city: "San Francisco",
      state: "CA",
      website: "https://citywinery.example.com",
      instagram: "citywinery",
      createdByUserId: demoUsers[0]?.id || "user_demo_1",
    },
    {
      slug: "the-fillmore",
      name: "The Fillmore",
      description:
        "Historic music venue hosting concerts since the 1960s. Rock, indie, and alternative shows.",
      city: "San Francisco",
      state: "CA",
      website: "https://thefillmore.example.com",
      instagram: "thefillmore",
      createdByUserId: demoUsers[1]?.id || "user_demo_2",
    },
    {
      slug: "golden-gate-brewery",
      name: "Golden Gate Brewery",
      description:
        "Craft brewery with tasting room and beer garden. Weekly events and live music.",
      city: "San Francisco",
      state: "CA",
      website: "https://goldengatebrewery.example.com",
      instagram: "goldengatebrewery",
      createdByUserId: demoUsers[1]?.id || "user_demo_2",
    },
    {
      slug: "mission-arts-center",
      name: "Mission Arts Center",
      description:
        "Community arts space featuring galleries, workshops, and cultural events.",
      city: "San Francisco",
      state: "CA",
      website: "https://missionarts.example.com",
      instagram: "missionarts",
      createdByUserId: demoUsers[2]?.id || "user_demo_3",
    },
  ];

  const createdBusinesses = await db
    .insert(businesses)
    .values(businessData)
    .onConflictDoNothing()
    .returning();

  console.log(`✓ Created ${createdBusinesses.length} businesses`);

  // Create events
  console.log("Creating events...");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(20, 0, 0, 0);

  const threeDays = new Date(now);
  threeDays.setDate(threeDays.getDate() + 3);
  threeDays.setHours(18, 30, 0, 0);

  const fourDays = new Date(now);
  fourDays.setDate(fourDays.getDate() + 4);
  fourDays.setHours(21, 0, 0, 0);

  const fiveDays = new Date(now);
  fiveDays.setDate(fiveDays.getDate() + 5);
  fiveDays.setHours(17, 0, 0, 0);

  const sixDays = new Date(now);
  sixDays.setDate(sixDays.getDate() + 6);
  sixDays.setHours(19, 30, 0, 0);

  const eventData = [
    {
      businessId: createdBusinesses[0]?.id,
      title: "Friday Night Jazz Sessions",
      description:
        "Join us for an evening of smooth jazz featuring the Sarah Chen Quartet. Enjoy craft cocktails and small plates while experiencing world-class musicianship.",
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      venueName: "Blue Note Main Stage",
      address: "2350 Market Street",
      city: "San Francisco",
      state: "CA",
      category: "music" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[0]?.id || "user_demo_1",
    },
    {
      businessId: createdBusinesses[1]?.id,
      title: "Wine Tasting & Live Acoustic",
      description:
        "Sample our new winter wine collection paired with acoustic performances by local artists. Limited seating available.",
      startAt: dayAfter,
      endAt: new Date(dayAfter.getTime() + 2 * 60 * 60 * 1000),
      venueName: "City Winery Tasting Room",
      address: "650 Delancey Street",
      city: "San Francisco",
      state: "CA",
      category: "food" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[0]?.id || "user_demo_1",
    },
    {
      businessId: createdBusinesses[2]?.id,
      title: "The Midnight Revival - Live in Concert",
      description:
        "Indie rock sensation The Midnight Revival brings their electrifying show to The Fillmore. Special opening act TBA.",
      startAt: threeDays,
      endAt: new Date(threeDays.getTime() + 4 * 60 * 60 * 1000),
      venueName: "The Fillmore",
      address: "1805 Geary Boulevard",
      city: "San Francisco",
      state: "CA",
      category: "music" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[1]?.id || "user_demo_2",
    },
    {
      businessId: createdBusinesses[3]?.id,
      title: "IPA Release Party",
      description:
        "Be the first to try our new West Coast IPA! Food trucks, live music, and brewery tours throughout the evening.",
      startAt: fourDays,
      endAt: new Date(fourDays.getTime() + 5 * 60 * 60 * 1000),
      venueName: "Golden Gate Beer Garden",
      address: "3158 16th Street",
      city: "San Francisco",
      state: "CA",
      category: "food" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[1]?.id || "user_demo_2",
    },
    {
      businessId: createdBusinesses[4]?.id,
      title: "Community Art Exhibition Opening",
      description:
        "Celebrate local artists at our quarterly exhibition opening. Meet the artists, enjoy refreshments, and explore diverse works from our community.",
      startAt: fiveDays,
      endAt: new Date(fiveDays.getTime() + 3 * 60 * 60 * 1000),
      venueName: "Mission Arts Gallery",
      address: "2868 Mission Street",
      city: "San Francisco",
      state: "CA",
      category: "art" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[2]?.id || "user_demo_3",
    },
    {
      businessId: createdBusinesses[0]?.id,
      title: "Saturday Blues Brunch",
      description:
        "Start your weekend right with live blues music and our signature brunch menu. Bottomless mimosas available.",
      startAt: sixDays,
      endAt: new Date(sixDays.getTime() + 3 * 60 * 60 * 1000),
      venueName: "Blue Note Jazz Club",
      address: "2350 Market Street",
      city: "San Francisco",
      state: "CA",
      category: "music" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[0]?.id || "user_demo_1",
    },
    {
      businessId: null,
      title: "Golden Gate Park Yoga Session",
      description:
        "Free community yoga class in the park. All levels welcome. Bring your own mat.",
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 1.5 * 60 * 60 * 1000),
      venueName: "Golden Gate Park",
      address: "Music Concourse",
      city: "San Francisco",
      state: "CA",
      category: "community" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[2]?.id || "user_demo_3",
    },
    {
      businessId: null,
      title: "Tech Networking Happy Hour",
      description:
        "Connect with other tech professionals in the Bay Area. Casual networking over drinks and appetizers.",
      startAt: threeDays,
      endAt: new Date(threeDays.getTime() + 2 * 60 * 60 * 1000),
      venueName: "The Ramp",
      address: "855 Terry A Francois Boulevard",
      city: "San Francisco",
      state: "CA",
      category: "nightlife" as const,
      visibility: "public" as const,
      createdByUserId: demoUsers[1]?.id || "user_demo_2",
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
