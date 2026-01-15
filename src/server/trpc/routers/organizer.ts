import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { organizers, organizerMembers, organizerFollows, events, users } from "../../db/schema";
import { eq, and, desc, or, like, gte, asc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const organizerRouter = router({
  listOrganizers: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(organizers.name, `%${input.search}%`),
            like(organizers.description, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db.query.organizers.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(organizers.createdAt)],
        with: {
          follows: true,
          members: true,
        },
      });

      return results;
    }),

  getOrganizerBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const organizer = await ctx.db.query.organizers.findFirst({
        where: eq(organizers.slug, input.slug),
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

      if (!organizer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organizer not found",
        });
      }

      return organizer;
    }),

  followOrganizer: protectedProcedure
    .input(z.object({ organizerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already following
      const existing = await ctx.db.query.organizerFollows.findFirst({
        where: and(
          eq(organizerFollows.userId, ctx.auth.userId),
          eq(organizerFollows.organizerId, input.organizerId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already following this organizer",
        });
      }

      const [follow] = await ctx.db
        .insert(organizerFollows)
        .values({
          userId: ctx.auth.userId,
          organizerId: input.organizerId,
        })
        .returning();

      return follow;
    }),

  unfollowOrganizer: protectedProcedure
    .input(z.object({ organizerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(organizerFollows)
        .where(
          and(
            eq(organizerFollows.userId, ctx.auth.userId),
            eq(organizerFollows.organizerId, input.organizerId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not following this organizer",
        });
      }

      return { success: true };
    }),

  isFollowingOrganizer: protectedProcedure
    .input(z.object({ organizerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.query.organizerFollows.findFirst({
        where: and(
          eq(organizerFollows.userId, ctx.auth.userId),
          eq(organizerFollows.organizerId, input.organizerId)
        ),
      });

      return !!follow;
    }),

  listFollowedOrganizers: protectedProcedure.query(async ({ ctx }) => {
    const followedOrganizers = await ctx.db.query.organizerFollows.findMany({
      where: eq(organizerFollows.userId, ctx.auth.userId),
      with: {
        organizer: {
          with: {
            follows: true,
            members: true,
          },
        },
      },
      orderBy: [desc(organizerFollows.createdAt)],
    });

    return followedOrganizers.map((f) => f.organizer);
  }),

  getMyOrganizers: protectedProcedure.query(async ({ ctx }) => {
    const myOrganizers = await ctx.db.query.organizerMembers.findMany({
      where: eq(organizerMembers.userId, ctx.auth.userId),
      with: {
        organizer: {
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
      orderBy: [desc(organizerMembers.createdAt)],
    });

    return myOrganizers.map((m) => m.organizer);
  }),

  updateOrganizer: protectedProcedure
    .input(
      z.object({
        organizerId: z.string().uuid(),
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or organizer member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.organizerMembers.findFirst({
        where: and(
          eq(organizerMembers.userId, ctx.auth.userId),
          eq(organizerMembers.organizerId, input.organizerId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this organizer",
        });
      }

      // If slug is being updated, check if it's already taken
      if (input.slug) {
        const existing = await ctx.db.query.organizers.findFirst({
          where: and(
            eq(organizers.slug, input.slug),
            sql`${organizers.id} != ${input.organizerId}`
          ),
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An organizer with this slug already exists",
          });
        }
      }

      const { organizerId, ...updates } = input;

      const [updated] = await ctx.db
        .update(organizers)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(organizers.id, organizerId))
        .returning();

      return updated;
    }),

  getOrganizerMembers: protectedProcedure
    .input(z.object({ organizerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin or organizer member
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isMember = await ctx.db.query.organizerMembers.findFirst({
        where: and(
          eq(organizerMembers.userId, ctx.auth.userId),
          eq(organizerMembers.organizerId, input.organizerId)
        ),
      });

      if (!isAdmin && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view organizer members",
        });
      }

      const members = await ctx.db.query.organizerMembers.findMany({
        where: eq(organizerMembers.organizerId, input.organizerId),
        with: {
          user: true,
        },
        orderBy: [desc(organizerMembers.createdAt)],
      });

      return members;
    }),
});
