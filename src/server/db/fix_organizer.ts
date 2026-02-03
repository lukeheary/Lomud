import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("Ensuring columns exist on places table...");
        await pool.query(`
      ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "city" varchar(100);
      ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "state" varchar(2);
      CREATE INDEX IF NOT EXISTS "places_location_idx" ON "places" ("city", "state");
    `);
        console.log("Success!");
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await pool.end();
    }
}

run();
