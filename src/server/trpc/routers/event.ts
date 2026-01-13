import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { events, businesses, rsvps, follows, friends } from "../../db/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const eventRouter = router({
  createEvent: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid().optional(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        startAt: z.date(),
        endAt: z.date().optional(),
        venueName: z.string().max(255).optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().length(2),
        category: z.enum([
          "music",
          "food",
          "art",
          "sports",
          "community",
          "nightlife",
          "other",
        ]),
        visibility: z.enum(["public", "private"]).default("public"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If businessId provided, verify user owns the business
      if (input.businessId) {
        const business = await ctx.db.query.businesses.findFirst({
          where: eq(businesses.id, input.businessId),
        });

        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }

        if (business.createdByUserId !== ctx.auth.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not own this business",
          });
        }
      }

      // Validate startAt < endAt if endAt provided
      if (input.endAt && input.startAt >= input.endAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      const [event] = await ctx.db
        .insert(events)
        .values({
          title: input.title,
          venueName: input.venueName ?? null,
          city: input.city,
          state: input.state,
          category: input.category,
          startAt: input.startAt,
          visibility: input.visibility,
          createdByUserId: ctx.auth.userId,
          description: input.description ?? null,
          address: input.address ?? null,
          endAt: input.endAt ?? null,
          businessId: input.businessId ?? null,
        } as any)
        .returning();

      return event;
    }),

  listEventsByRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        followedOnly: z.boolean().default(false),
        friendsGoingOnly: z.boolean().default(false),
        category: z
          .enum([
            "music",
            "food",
            "art",
            "sports",
            "community",
            "nightlife",
            "other",
          ])
          .optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build where conditions
      const conditions = [
        gte(events.startAt, input.startDate),
        lte(events.startAt, input.endDate),
        eq(events.visibility, "public"),
      ];

      // Add category filter
      if (input.category) {
        conditions.push(eq(events.category, input.category));
      }

      // Add location filters
      if (input.city) {
        conditions.push(eq(events.city, input.city));
      }
      if (input.state) {
        conditions.push(eq(events.state, input.state));
      }

      // Filter by followed businesses
      if (input.followedOnly) {
        const userFollows = await ctx.db.query.follows.findMany({
          where: eq(follows.userId, ctx.auth.userId),
        });

        const followedBusinessIds = userFollows.map((f) => f.businessId);

        if (followedBusinessIds.length > 0) {
          conditions.push(inArray(events.businessId, followedBusinessIds));
        } else {
          // User follows no businesses, return empty
          return [];
        }
      }

      // Filter by events friends are going to
      if (input.friendsGoingOnly) {
        const userFriends = await ctx.db.query.friends.findMany({
          where: and(
            eq(friends.userId, ctx.auth.userId),
            eq(friends.status, "accepted")
          ),
        });

        const friendIds = userFriends.map((f) => f.friendUserId);

        if (friendIds.length > 0) {
          const friendRsvps = await ctx.db.query.rsvps.findMany({
            where: and(
              inArray(rsvps.userId, friendIds),
              eq(rsvps.status, "going")
            ),
          });

          const eventIdsWithFriends = friendRsvps.map((r) => r.eventId);

          if (eventIdsWithFriends.length > 0) {
            conditions.push(inArray(events.id, eventIdsWithFriends));
          } else {
            // No friends going to any events
            return [];
          }
        } else {
          // User has no friends
          return [];
        }
      }

      // Fetch events with all conditions
      const eventList = await ctx.db.query.events.findMany({
        where: and(...conditions),
        orderBy: [events.startAt],
        limit: input.limit,
        offset: input.offset,
        with: {
          business: true,
          createdBy: true,
        },
      });

      // Fetch user's RSVPs for these events
      const eventIds = eventList.map((e) => e.id);
      const userRsvps =
        eventIds.length > 0
          ? await ctx.db.query.rsvps.findMany({
              where: and(
                eq(rsvps.userId, ctx.auth.userId),
                inArray(rsvps.eventId, eventIds)
              ),
            })
          : [];

      // Create a map of event IDs to RSVPs
      const rsvpMap = new Map(userRsvps.map((r) => [r.eventId, r]));

      // Attach user RSVP to each event
      const eventsWithData = eventList.map((event) => ({
        ...event,
        userRsvp: rsvpMap.get(event.id) || null,
      }));

      return eventsWithData;
    }),

  getEventById: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        with: {
          business: true,
          createdBy: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Get user's RSVP if authenticated
      let userRsvp = null;
      if (ctx.auth.userId) {
        userRsvp = await ctx.db.query.rsvps.findFirst({
          where: and(
            eq(rsvps.eventId, input.eventId),
            eq(rsvps.userId, ctx.auth.userId)
          ),
        });
      }

      return {
        ...event,
        userRsvp,
      };
    }),

  setRsvpStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z.enum(["going", "interested", "not_going"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event exists
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Upsert RSVP
      const [rsvp] = await ctx.db
        .insert(rsvps)
        .values({
          userId: ctx.auth.userId,
          eventId: input.eventId,
          status: input.status,
        })
        .onConflictDoUpdate({
          target: [rsvps.userId, rsvps.eventId],
          set: {
            status: input.status,
            updatedAt: new Date(),
          },
        })
        .returning();

      return rsvp;
    }),

  listEventAttendees: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        statusFilter: z.enum(["going", "interested", "not_going"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(rsvps.eventId, input.eventId)];

      if (input.statusFilter) {
        conditions.push(eq(rsvps.status, input.statusFilter));
      }

      const attendees = await ctx.db.query.rsvps.findMany({
        where: and(...conditions),
        with: {
          user: true,
        },
        orderBy: [desc(rsvps.createdAt)],
      });

      return attendees;
    }),

  getUserRsvp: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rsvp = await ctx.db.query.rsvps.findFirst({
        where: and(
          eq(rsvps.eventId, input.eventId),
          eq(rsvps.userId, ctx.auth.userId)
        ),
      });

      return rsvp;
    }),
});
