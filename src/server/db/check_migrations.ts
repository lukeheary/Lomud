import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const res = await pool.query(`
      SELECT hash, created_at 
      FROM __drizzle_migrations
      ORDER BY created_at DESC
    `);
        console.log("Applied migrations:", res.rows);
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await pool.end();
    }
}

run();
