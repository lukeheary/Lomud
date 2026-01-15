import { z } from "zod";
import { router, adminProcedure } from "../init";
import {
  venues,
  organizers,
  venueMembers,
  organizerMembers,
  users,
} from "../../db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // ============================================================================
  // VENUE MANAGEMENT
  // ============================================================================

  createVenue: adminProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().length(2, "State must be 2-letter code"),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await ctx.db.query.venues.findFirst({
        where: eq(venues.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A venue with this slug already exists",
        });
      }

      const [venue] = await ctx.db.insert(venues).values(input).returning();

      return venue;
    }),

  addVenueMember: adminProcedure
    .input(
      z.object({
        venueId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if venue exists
      const venue = await ctx.db.query.venues.findFirst({
        where: eq(venues.id, input.venueId),
      });

      if (!venue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venue not found",
        });
      }

      // Check if already a member
      const existing = await ctx.db.query.venueMembers.findFirst({
        where: and(
          eq(venueMembers.userId, input.userId),
          eq(venueMembers.venueId, input.venueId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this venue",
        });
      }

      const [member] = await ctx.db
        .insert(venueMembers)
        .values({
          userId: input.userId,
          venueId: input.venueId,
        })
        .returning();

      return member;
    }),

  removeVenueMember: adminProcedure
    .input(
      z.object({
        venueId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(venueMembers)
        .where(
          and(
            eq(venueMembers.userId, input.userId),
            eq(venueMembers.venueId, input.venueId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venue membership not found",
        });
      }

      return { success: true };
    }),

  listAllVenues: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(venues.name, `%${input.search}%`),
            like(venues.slug, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db.query.venues.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(venues.createdAt)],
        with: {
          members: true,
          follows: true,
        },
      });

      return results;
    }),

  // ============================================================================
  // ORGANIZER MANAGEMENT
  // ============================================================================

  createOrganizer: adminProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await ctx.db.query.organizers.findFirst({
        where: eq(organizers.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organizer with this slug already exists",
        });
      }

      const [organizer] = await ctx.db.insert(organizers).values(input).returning();

      return organizer;
    }),

  addOrganizerMember: adminProcedure
    .input(
      z.object({
        organizerId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if organizer exists
      const organizer = await ctx.db.query.organizers.findFirst({
        where: eq(organizers.id, input.organizerId),
      });

      if (!organizer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organizer not found",
        });
      }

      // Check if already a member
      const existing = await ctx.db.query.organizerMembers.findFirst({
        where: and(
          eq(organizerMembers.userId, input.userId),
          eq(organizerMembers.organizerId, input.organizerId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this organizer",
        });
      }

      const [member] = await ctx.db
        .insert(organizerMembers)
        .values({
          userId: input.userId,
          organizerId: input.organizerId,
        })
        .returning();

      return member;
    }),

  removeOrganizerMember: adminProcedure
    .input(
      z.object({
        organizerId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(organizerMembers)
        .where(
          and(
            eq(organizerMembers.userId, input.userId),
            eq(organizerMembers.organizerId, input.organizerId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organizer membership not found",
        });
      }

      return { success: true };
    }),

  listAllOrganizers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(organizers.name, `%${input.search}%`),
            like(organizers.slug, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db.query.organizers.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(organizers.createdAt)],
        with: {
          members: true,
          follows: true,
        },
      });

      return results;
    }),

  // ============================================================================
  // USER SEARCH
  // ============================================================================

  searchUsers: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.query.users.findMany({
        where: or(
          like(users.username, `%${input.query}%`),
          like(users.email, `%${input.query}%`),
          like(users.firstName, `%${input.query}%`),
          like(users.lastName, `%${input.query}%`)
        ),
        limit: input.limit,
        orderBy: [desc(users.createdAt)],
      });

      return results;
    }),
});
