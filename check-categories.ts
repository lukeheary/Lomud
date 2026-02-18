import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./src/server/db/schema";
import { categories, eventCategories, events } from "./src/server/db/schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // console.log("Checking venues...");
  // const allVenues = await db
  //   .select({ name: venues.name, categories: venues.categories })
  //   .from(venues);
  // allVenues.forEach((v) => {
  //   console.log(
  //     `Venue: ${v.name}, Categories: ${JSON.stringify(v.categories)}`
  //   );
  // });

  console.log("\nChecking events...");
  const allEvents = await db.select({ id: events.id, title: events.title }).from(events);

  for (const e of allEvents) {
    const rows = await db
      .select({ key: categories.key })
      .from(eventCategories)
      .innerJoin(categories, eq(categories.id, eventCategories.categoryId))
      .where(eq(eventCategories.eventId, e.id));

    console.log(
      `Event: ${e.title}, Categories: ${JSON.stringify(rows.map((row) => row.key))}`
    );
  }

  await pool.end();
}

main().catch(console.error);
