import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { businesses, follows, events, rsvps } from "../../db/schema";
import { eq, and, desc, or, like, gte, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const businessRouter = router({
  createBusiness: protectedProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug must be lowercase alphanumeric with hyphens"
          ),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().length(2, "State must be 2-letter code"),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await ctx.db.query.businesses.findFirst({
        where: eq(businesses.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A business with this slug already exists",
        });
      }

      const [business] = await ctx.db
        .insert(businesses)
        .values({
          ...input,
          createdByUserId: ctx.auth.userId,
        })
        .returning();

      return business;
    }),

  getBusinessBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: eq(businesses.slug, input.slug),
        with: {
          createdBy: true,
          follows: true,
          events: {
            where: gte(events.startAt, new Date()),
            orderBy: [asc(events.startAt)],
          },
        },
      });

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business not found",
        });
      }

      return business;
    }),

  listBusinesses: publicProcedure
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

      if (input.city) conditions.push(eq(businesses.city, input.city));
      if (input.state) conditions.push(eq(businesses.state, input.state));
      if (input.search) {
        conditions.push(
          or(
            like(businesses.name, `%${input.search}%`),
            like(businesses.description, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db.query.businesses.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(businesses.createdAt)],
        with: {
          follows: true,
        },
      });

      return results;
    }),

  followBusiness: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already following
      const existing = await ctx.db.query.follows.findFirst({
        where: and(
          eq(follows.userId, ctx.auth.userId),
          eq(follows.businessId, input.businessId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already following this business",
        });
      }

      const [follow] = await ctx.db
        .insert(follows)
        .values({
          userId: ctx.auth.userId,
          businessId: input.businessId,
        })
        .returning();

      return follow;
    }),

  unfollowBusiness: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(follows)
        .where(
          and(
            eq(follows.userId, ctx.auth.userId),
            eq(follows.businessId, input.businessId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not following this business",
        });
      }

      return { success: true };
    }),

  listFollowedBusinesses: protectedProcedure.query(async ({ ctx }) => {
    const followedBusinesses = await ctx.db.query.follows.findMany({
      where: eq(follows.userId, ctx.auth.userId),
      with: {
        business: {
          with: {
            follows: true,
          },
        },
      },
      orderBy: [desc(follows.createdAt)],
    });

    return followedBusinesses.map((f) => f.business);
  }),

  isFollowing: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.query.follows.findFirst({
        where: and(
          eq(follows.userId, ctx.auth.userId),
          eq(follows.businessId, input.businessId)
        ),
      });

      return !!follow;
    }),
});
