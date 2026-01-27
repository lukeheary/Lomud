import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import {
  events,
  friends,
  organizerFollows,
  organizerMembers,
  organizers,
  rsvps,
  users,
} from "../../db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../utils/activity-logger";

export const organizerRouter = router({
  listOrganizers: publicProcedure
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

      if (input.city) conditions.push(eq(organizers.city, input.city));
      if (input.state) conditions.push(eq(organizers.state, input.state));

      if (input.search) {
        conditions.push(ilike(organizers.name, `%${input.search}%`));
      }

      return await ctx.db.query.organizers.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(organizers.createdAt)],
        with: {
          follows: true,
          members: true,
        },
      });
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
        },
      });

      if (!organizer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organizer not found",
        });
      }

      const now = new Date();

      const upcomingEvents = await ctx.db.query.events.findMany({
        where: and(eq(events.organizerId, organizer.id), gte(events.startAt, now)),
        orderBy: [asc(events.startAt)],
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      const pastEvents = await ctx.db.query.events.findMany({
        where: and(eq(events.organizerId, organizer.id), lt(events.startAt, now)),
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

        const friendIds = userFriends.map((f: any) =>
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
        ...organizer,
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

      if (follow) {
        void logActivity({
          actorUserId: ctx.auth.userId,
          type: "follow_organizer",
          entityType: "organizer",
          entityId: input.organizerId,
          metadata: {},
        });
      }

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
        imageUrl: z.string().url().optional().or(z.literal("")),
        city: z.string().max(100).optional(),
        state: z.string().length(2).optional(),
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
