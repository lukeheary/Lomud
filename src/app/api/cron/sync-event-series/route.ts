import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { materializeEventSeries } from "@/server/utils/event-series";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function runSync() {
  const result = await materializeEventSeries(db, {
    lookaheadDays: 30,
  });

  return NextResponse.json({
    ok: true,
    processedSeries: result.processedSeries,
    createdEvents: result.createdEvents,
    firstCreatedEventId: result.firstCreatedEventId,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runSync();
  } catch (error) {
    console.error("Event series sync failed:", error);
    return NextResponse.json(
      { error: "Event series sync failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
