import { z } from "zod";
import { router, adminProcedure } from "../init";
import {
  cities,
  metroAreas,
  places,
  placeMembers,
  users,
} from "../../db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { filterValidCategories } from "@/lib/categories";

const placeTypeSchema = z.enum(["venue", "organizer"]);
const placeMemberRoleSchema = z.enum([
  "owner",
  "manager",
  "promoter",
  "staff",
]);

export const adminRouter = router({
  // ============================================================================
  // PLACE MANAGEMENT
  // ============================================================================

  createPlace: adminProcedure
    .input(
      z.object({
        type: placeTypeSchema,
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
        logoImageUrl: z.string().url().optional().or(z.literal("")),
        coverImageUrl: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().length(2, "State must be 2-letter code").optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().max(100).optional(),
        hours: z.any().optional(),
        categories: z.array(z.string()).optional().default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await ctx.db.query.places.findFirst({
        where: eq(places.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A place with this slug already exists",
        });
      }

      const { categories, ...rest } = input;
      const [place] = await ctx.db
        .insert(places)
        .values({
          ...rest,
          categories: filterValidCategories(categories || []),
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

  addPlaceMember: adminProcedure
    .input(
      z.object({
        placeId: z.string().uuid(),
        userId: z.string(),
        role: placeMemberRoleSchema.default("staff"),
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

      // Check if place exists
      const place = await ctx.db.query.places.findFirst({
        where: eq(places.id, input.placeId),
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Place not found",
        });
      }

      // Check if already a member
      const existing = await ctx.db.query.placeMembers.findFirst({
        where: and(
          eq(placeMembers.userId, input.userId),
          eq(placeMembers.placeId, input.placeId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this place",
        });
      }

      const [member] = await ctx.db
        .insert(placeMembers)
        .values({
          userId: input.userId,
          placeId: input.placeId,
          role: input.role,
        })
        .returning();

      return member;
    }),

  removePlaceMember: adminProcedure
    .input(
      z.object({
        placeId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(placeMembers)
        .where(
          and(
            eq(placeMembers.userId, input.userId),
            eq(placeMembers.placeId, input.placeId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Place membership not found",
        });
      }

      return { success: true };
    }),

  listAllPlaces: adminProcedure
    .input(
      z.object({
        type: placeTypeSchema.optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.type) {
        conditions.push(eq(places.type, input.type));
      }

      if (input.search) {
        conditions.push(
          or(
            ilike(places.name, `%${input.search}%`),
            ilike(places.slug, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db.query.places.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(places.createdAt)],
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
      const terms = input.query
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const nameSearchConditions = terms.map((term) =>
        or(
          ilike(users.username, `%${term}%`),
          ilike(users.email, `%${term}%`),
          ilike(users.firstName, `%${term}%`),
          ilike(users.lastName, `%${term}%`)
        )
      );

      const results = await ctx.db.query.users.findMany({
        where:
          nameSearchConditions.length > 0
            ? and(...nameSearchConditions)
            : undefined,
        limit: input.limit,
        orderBy: [desc(users.createdAt)],
      });

      return results;
    }),

  // ============================================================================
  // METRO AREA MANAGEMENT
  // ============================================================================

  listMetroAreas: adminProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select()
      .from(metroAreas)
      .orderBy(metroAreas.name);

    return results;
  }),

  createMetroArea: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        state: z.string().length(2, "State must be a 2-letter code"),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusMiles: z.number().min(1).max(200).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.metroAreas.findFirst({
        where: and(
          eq(metroAreas.name, input.name),
          eq(metroAreas.state, input.state)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A metro area with this name and state already exists",
        });
      }

      const [metro] = await ctx.db
        .insert(metroAreas)
        .values(input)
        .returning();

      return metro;
    }),

  updateMetroArea: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        state: z.string().length(2, "State must be a 2-letter code"),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusMiles: z.number().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.query.metroAreas.findFirst({
        where: eq(metroAreas.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Metro area not found",
        });
      }

      // Check for name/state conflict with other metro areas
      const conflict = await ctx.db.query.metroAreas.findFirst({
        where: and(
          eq(metroAreas.name, data.name),
          eq(metroAreas.state, data.state)
        ),
      });

      if (conflict && conflict.id !== id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Another metro area with this name and state already exists",
        });
      }

      const [updated] = await ctx.db
        .update(metroAreas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(metroAreas.id, id))
        .returning();

      return updated;
    }),

  deleteMetroArea: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(metroAreas)
        .where(eq(metroAreas.id, input.id))
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Metro area not found",
        });
      }

      return { success: true };
    }),
});
