import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tables:", res.rows.map(r => r.table_name));
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await pool.end();
    }
}

run();
