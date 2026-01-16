import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import {
  events,
  users,
  venueFollows,
  venueMembers,
  venues,
} from "../../db/schema";
import { and, asc, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const venueRouter = router({
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
          events: {
            where: gte(events.startAt, new Date()),
            orderBy: [asc(events.startAt)],
          },
        },
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
        imageUrl: z.string().url().optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100).optional(),
        state: z.string().length(2).optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
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
