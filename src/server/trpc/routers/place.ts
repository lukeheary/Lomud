import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import {
  cities,
  events,
  friends,
  rsvps,
  users,
  placeFollows,
  placeMembers,
  places,
} from "../../db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../utils/activity-logger";
import { filterValidCategories } from "@/lib/categories";

const placeTypeSchema = z.enum(["venue", "organizer"]);

export const placeRouter = router({
  searchPlaces: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      type: placeTypeSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.query) {
        conditions.push(ilike(places.name, `%${input.query}%`));
      }
      if (input.type) {
        conditions.push(eq(places.type, input.type));
      }

      return await ctx.db.query.places.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: 10,
        orderBy: [asc(places.name)],
      });
    }),

  createPlace: protectedProcedure
    .input(
      z.object({
        type: placeTypeSchema,
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        logoImageUrl: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().length(2).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate initial slug
      let slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (slug.length < 3) slug = `${input.type}-${slug}`;

      // Check for collision
      const existing = await ctx.db.query.places.findFirst({
        where: eq(places.slug, slug),
      });

      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      const [place] = await ctx.db
        .insert(places)
        .values({
          ...input,
          slug,
        })
        .returning();

      if (
        input.city &&
        input.state &&
        input.latitude != null &&
        input.longitude != null
      ) {
        await ctx.db
          .insert(cities)
          .values({
            name: input.city,
            state: input.state,
            latitude: input.latitude,
            longitude: input.longitude,
          })
          .onConflictDoNothing();
      }

      return place;
    }),

  listPlaces: publicProcedure
    .input(
      z.object({
        type: placeTypeSchema.optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        search: z.string().optional(),
        followedOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.type) conditions.push(eq(places.type, input.type));
      if (input.city) conditions.push(eq(places.city, input.city));
      if (input.state) conditions.push(eq(places.state, input.state));
      if (input.search) {
        conditions.push(ilike(places.name, `%${input.search}%`));
      }

      if (input.followedOnly) {
        if (!ctx.auth.userId) {
          return [];
        }

        const followedPlaceIds = await ctx.db
          .select({ placeId: placeFollows.placeId })
          .from(placeFollows)
          .where(eq(placeFollows.userId, ctx.auth.userId));

        if (followedPlaceIds.length === 0) {
          return [];
        }

        conditions.push(
          inArray(
            places.id,
            followedPlaceIds.map((f) => f.placeId)
          )
        );
      }

      return await ctx.db.query.places.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(places.createdAt)],
        with: {
          follows: true,
          members: true,
        },
      });
    }),

  getPlaceBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const place = await ctx.db.query.places.findFirst({
        where: eq(places.slug, input.slug),
        with: {
          follows: true,
          members: {
            with: {
              user: true,
            },
          },
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Place not found",
        });
      }

      const now = new Date();

      // Get events where this place is either the venue or the organizer
      const eventCondition = place.type === "venue"
        ? eq(events.venueId, place.id)
        : eq(events.organizerId, place.id);

      const upcomingEvents = await ctx.db.query.events.findMany({
        where: and(eventCondition, gte(events.startAt, now)),
        orderBy: [asc(events.startAt)],
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      const pastEvents = await ctx.db.query.events.findMany({
        where: and(eventCondition, lt(events.startAt, now)),
        orderBy: [desc(events.startAt)],
        limit: 12,
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      // Fetch friendsGoing and userRsvp for these events if user is authenticated
      const allEventIds = [...upcomingEvents, ...pastEvents].map((e) => e.id);
      const attendeesMap = new Map<string, any[]>();
      const userRsvpMap = new Map<string, any>();

      if (ctx.auth.userId && allEventIds.length > 0) {
        // Fetch user RSVPs
        const userRsvps = await ctx.db.query.rsvps.findMany({
          where: and(
            inArray(rsvps.eventId, allEventIds),
            eq(rsvps.userId, ctx.auth.userId)
          ),
        });
        for (const rsvp of userRsvps) {
          userRsvpMap.set(rsvp.eventId, rsvp);
        }

        const userFriends = await ctx.db.query.friends.findMany({
          where: and(
            or(
              eq(friends.userId, ctx.auth.userId),
              eq(friends.friendUserId, ctx.auth.userId)
            ),
            eq(friends.status, "accepted")
          ),
        });

        const friendIds = userFriends.map((f) =>
          f.userId === ctx.auth.userId ? f.friendUserId : f.userId
        );

        if (friendIds.length > 0) {
          const friendsRsvps = await ctx.db.query.rsvps.findMany({
            where: and(
              inArray(rsvps.eventId, allEventIds),
              inArray(rsvps.userId, friendIds),
              eq(rsvps.status, "going")
            ),
            with: {
              user: true,
            },
          });

          for (const rsvp of friendsRsvps) {
            if (!attendeesMap.has(rsvp.eventId)) {
              attendeesMap.set(rsvp.eventId, []);
            }
            attendeesMap.get(rsvp.eventId)!.push(rsvp);
          }
        }
      }

      return {
        ...place,
        events: upcomingEvents.map((e) => ({
          ...e,
          userRsvp: userRsvpMap.get(e.id) || null,
          friendsGoing: attendeesMap.get(e.id) || [],
        })),
        pastEvents: pastEvents.map((e) => ({
          ...e,
          userRsvp: userRsvpMap.get(e.id) || null,
          friendsGoing: attendeesMap.get(e.id) || [],
        })),
      };
    }),

  getPlaceById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const place = await ctx.db.query.places.findFirst({
        where: eq(places.id, input.id),
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Place not found",
        });
      }

      return place;
    }),

  followPlace: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already following
      const existing = await ctx.db.query.placeFollows.findFirst({
        where: and(
          eq(placeFollows.userId, ctx.auth.userId),
          eq(placeFollows.placeId, input.placeId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already following this place",
        });
      }

      const [follow] = await ctx.db
        .insert(placeFollows)
        .values({
          userId: ctx.auth.userId,
          placeId: input.placeId,
        })
        .returning();

      if (follow) {
        void logActivity({
          actorUserId: ctx.auth.userId,
          type: "follow_place",
          entityType: "place",
          entityId: input.placeId,
          metadata: {},
        });
      }

      return follow;
    }),

  unfollowPlace: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(placeFollows)
        .where(
          and(
            eq(placeFollows.userId, ctx.auth.userId),
            eq(placeFollows.placeId, input.placeId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not following this place",
        });
      }

      return { success: true };
    }),

  isFollowingPlace: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.query.placeFollows.findFirst({
        where: and(
          eq(placeFollows.userId, ctx.auth.userId),
          eq(placeFollows.placeId, input.placeId)
        ),
      });

      return !!follow;
    }),

  listFollowedPlaces: protectedProcedure
    .input(z.object({ type: placeTypeSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const followedPlaces = await ctx.db.query.placeFollows.findMany({
        where: eq(placeFollows.userId, ctx.auth.userId),
        with: {
          place: {
            with: {
              follows: true,
              members: true,
            },
          },
        },
        orderBy: [desc(placeFollows.createdAt)],
      });

      let result = followedPlaces.map((f) => f.place);

      if (input?.type) {
        result = result.filter((p) => p.type === input.type);
      }

      return result;
    }),

  getMyPlaces: protectedProcedure
    .input(z.object({ type: placeTypeSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const myPlaces = await ctx.db.query.placeMembers.findMany({
        where: eq(placeMembers.userId, ctx.auth.userId),
        with: {
          place: {
            with: {
              follows: true,
              members: true,
            },
          },
        },
        orderBy: [desc(placeMembers.createdAt)],
      });

      let result = myPlaces.map((m) => m.place);

      if (input?.type) {
        result = result.filter((p) => p.type === input.type);
      }

      // Fetch upcoming events for each place
      const placeIds = result.map((p) => p.id);
      if (placeIds.length > 0) {
        const upcomingEventsMap = new Map<string, any[]>();

        // Get events where any of these places are venues
        const venueEvents = await ctx.db.query.events.findMany({
          where: and(
            inArray(events.venueId, placeIds),
            gte(events.startAt, new Date())
          ),
          orderBy: [asc(events.startAt)],
          limit: 50,
        });

        // Get events where any of these places are organizers
        const organizerEvents = await ctx.db.query.events.findMany({
          where: and(
            inArray(events.organizerId, placeIds),
            gte(events.startAt, new Date())
          ),
          orderBy: [asc(events.startAt)],
          limit: 50,
        });

        // Build map of place id to events
        for (const event of venueEvents) {
          if (event.venueId) {
            if (!upcomingEventsMap.has(event.venueId)) {
              upcomingEventsMap.set(event.venueId, []);
            }
            upcomingEventsMap.get(event.venueId)!.push(event);
          }
        }

        for (const event of organizerEvents) {
          if (event.organizerId) {
            if (!upcomingEventsMap.has(event.organizerId)) {
              upcomingEventsMap.set(event.organizerId, []);
            }
            upcomingEventsMap.get(event.organizerId)!.push(event);
          }
        }

        return result.map((place) => ({
          ...place,
          events: (upcomingEventsMap.get(place.id) || []).slice(0, 5),
        }));
      }

      return result.map((place) => ({
        ...place,
        events: [],
      }));
    }),

  updatePlace: protectedProcedure
    .input(
      z.object({
        placeId: z.string().uuid(),
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        logoImageUrl: z.string().url().optional().or(z.literal("")),
        coverImageUrl: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().length(2).optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        hours: z.any().optional(),
        categories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or place member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.placeMembers.findFirst({
        where: and(
          eq(placeMembers.userId, ctx.auth.userId),
          eq(placeMembers.placeId, input.placeId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this place",
        });
      }

      // If slug is being updated, check if it's already taken
      if (input.slug) {
        const existing = await ctx.db.query.places.findFirst({
          where: and(
            eq(places.slug, input.slug),
            sql`${places.id} != ${input.placeId}`
          ),
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A place with this slug already exists",
          });
        }
      }

      const { placeId, categories, ...updates } = input;

      // Filter out undefined values, but keep empty strings (for clearing fields)
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const [updated] = await ctx.db
        .update(places)
        .set({
          ...filteredUpdates,
          categories: categories !== undefined ? filterValidCategories(categories) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(places.id, placeId))
        .returning();

      return updated;
    }),

  getPlaceMembers: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin or place member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.placeMembers.findFirst({
        where: and(
          eq(placeMembers.userId, ctx.auth.userId),
          eq(placeMembers.placeId, input.placeId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view place members",
        });
      }

      const members = await ctx.db.query.placeMembers.findMany({
        where: eq(placeMembers.placeId, input.placeId),
        with: {
          user: true,
        },
        orderBy: [desc(placeMembers.createdAt)],
      });

      return members;
    }),
});
