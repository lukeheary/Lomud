import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import ws from "ws";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

async function runMigrations() {
  console.log("⏳ Running migrations...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });

  console.log("✅ Migrations complete!");
  await pool.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
