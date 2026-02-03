import { type AppRouter } from "@/server/trpc/root";
import { type inferRouterOutputs } from "@trpc/server";

/**
 * All tRPC router outputs inferred from the backend
 * This eliminates the need for hardcoded types and ensures type safety
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// ===== Event Types =====
/** Individual event item from the events list query */
export type EventListItem = RouterOutputs["event"]["listEventsByRange"][number];

/** Detailed event data including full RSVP info */
export type EventDetail = RouterOutputs["event"]["getEventById"];

// ===== User Types =====
/** Current authenticated user data */
export type CurrentUser = RouterOutputs["user"]["getCurrentUser"];
