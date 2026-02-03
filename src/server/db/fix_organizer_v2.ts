import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("Ensuring columns exist on places table...");
        // Check if table exists first
        const check = await pool.query(
            "SELECT to_regclass('public.places') as exists"
        );
        if (check.rows[0].exists) {
            await pool.query(`
        ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "city" varchar(100);
        ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "state" varchar(2);
        CREATE INDEX IF NOT EXISTS "places_location_idx" ON "places" ("city", "state");
      `);
            console.log("Successfully updated places table.");
        } else {
            console.log("Table 'places' does not exist. Attempting to find alternatives...");
            const tables = await pool.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            );
            console.log("Current tables:", tables.rows.map((r) => r.table_name));
        }
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await pool.end();
    }
}

run();
