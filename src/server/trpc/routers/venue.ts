import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import {
  events,
  friends,
  rsvps,
  users,
  venueFollows,
  venueMembers,
  venues,
} from "../../db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../utils/activity-logger";

export const venueRouter = router({
  searchVenues: publicProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.query) {
        conditions.push(ilike(venues.name, `%${input.query}%`));
      }

      return await ctx.db.query.venues.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: 10,
        orderBy: [asc(venues.name)],
      });
    }),

  createVenue: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().length(2),
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

      if (slug.length < 3) slug = `venue-${slug}`;

      // Check for collision
      const existing = await ctx.db.query.venues.findFirst({
        where: eq(venues.slug, slug),
      });

      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      const [venue] = await ctx.db
        .insert(venues)
        .values({
          ...input,
          slug,
        })
        .returning();

      return venue;
    }),

  listVenues: publicProcedure
    .input(
      z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.city) conditions.push(eq(venues.city, input.city));
      if (input.state) conditions.push(eq(venues.state, input.state));
      if (input.search) {
        conditions.push(ilike(venues.name, `%${input.search}%`));
      }

      return await ctx.db.query.venues.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(venues.createdAt)],
        with: {
          follows: true,
          members: true,
        },
      });
    }),

  getVenueBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.db.query.venues.findFirst({
        where: eq(venues.slug, input.slug),
        with: {
          follows: true,
          members: {
            with: {
              user: true,
            },
          },
        },
      });

      if (!venue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venue not found",
        });
      }

      const now = new Date();

      const upcomingEvents = await ctx.db.query.events.findMany({
        where: and(eq(events.venueId, venue.id), gte(events.startAt, now)),
        orderBy: [asc(events.startAt)],
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      const pastEvents = await ctx.db.query.events.findMany({
        where: and(eq(events.venueId, venue.id), lt(events.startAt, now)),
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
        ...venue,
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

  getVenueById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.db.query.venues.findFirst({
        where: eq(venues.id, input.id),
      });

      if (!venue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venue not found",
        });
      }

      return venue;
    }),

  followVenue: protectedProcedure
    .input(z.object({ venueId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already following
      const existing = await ctx.db.query.venueFollows.findFirst({
        where: and(
          eq(venueFollows.userId, ctx.auth.userId),
          eq(venueFollows.venueId, input.venueId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already following this venue",
        });
      }

      const [follow] = await ctx.db
        .insert(venueFollows)
        .values({
          userId: ctx.auth.userId,
          venueId: input.venueId,
        })
        .returning();

      if (follow) {
        void logActivity({
          actorUserId: ctx.auth.userId,
          type: "follow_venue",
          entityType: "venue",
          entityId: input.venueId,
          metadata: {},
        });
      }

      return follow;
    }),

  unfollowVenue: protectedProcedure
    .input(z.object({ venueId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(venueFollows)
        .where(
          and(
            eq(venueFollows.userId, ctx.auth.userId),
            eq(venueFollows.venueId, input.venueId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not following this venue",
        });
      }

      return { success: true };
    }),

  isFollowingVenue: protectedProcedure
    .input(z.object({ venueId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.query.venueFollows.findFirst({
        where: and(
          eq(venueFollows.userId, ctx.auth.userId),
          eq(venueFollows.venueId, input.venueId)
        ),
      });

      return !!follow;
    }),

  listFollowedVenues: protectedProcedure.query(async ({ ctx }) => {
    const followedVenues = await ctx.db.query.venueFollows.findMany({
      where: eq(venueFollows.userId, ctx.auth.userId),
      with: {
        venue: {
          with: {
            follows: true,
            members: true,
          },
        },
      },
      orderBy: [desc(venueFollows.createdAt)],
    });

    return followedVenues.map((f) => f.venue);
  }),

  getMyVenues: protectedProcedure.query(async ({ ctx }) => {
    const myVenues = await ctx.db.query.venueMembers.findMany({
      where: eq(venueMembers.userId, ctx.auth.userId),
      with: {
        venue: {
          with: {
            follows: true,
            members: true,
            events: {
              where: gte(events.startAt, new Date()),
              orderBy: [asc(events.startAt)],
              limit: 5,
            },
          },
        },
      },
      orderBy: [desc(venueMembers.createdAt)],
    });

    return myVenues.map((m) => m.venue);
  }),

  updateVenue: protectedProcedure
    .input(
      z.object({
        venueId: z.string().uuid(),
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().min(1).max(100).optional(),
        state: z.string().length(2).optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
        hours: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or venue member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.venueMembers.findFirst({
        where: and(
          eq(venueMembers.userId, ctx.auth.userId),
          eq(venueMembers.venueId, input.venueId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this venue",
        });
      }

      // If slug is being updated, check if it's already taken
      if (input.slug) {
        const existing = await ctx.db.query.venues.findFirst({
          where: and(
            eq(venues.slug, input.slug),
            sql`${venues.id} != ${input.venueId}`
          ),
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A venue with this slug already exists",
          });
        }
      }

      const { venueId, ...updates } = input;

      const [updated] = await ctx.db
        .update(venues)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(venues.id, venueId))
        .returning();

      return updated;
    }),

  getVenueMembers: protectedProcedure
    .input(z.object({ venueId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin or venue member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.venueMembers.findFirst({
        where: and(
          eq(venueMembers.userId, ctx.auth.userId),
          eq(venueMembers.venueId, input.venueId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view venue members",
        });
      }

      const members = await ctx.db.query.venueMembers.findMany({
        where: eq(venueMembers.venueId, input.venueId),
        with: {
          user: true,
        },
        orderBy: [desc(venueMembers.createdAt)],
      });

      return members;
    }),
});
