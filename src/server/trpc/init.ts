import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";
import superjson from "superjson";
import { db } from "../db";
import { users, venueMembers, organizerMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      auth: { ...ctx.auth, userId: ctx.auth.userId }, // Type narrowing
    },
  });
});

// Admin procedure - requires authentication and admin role
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, ctx.auth.userId),
  });

  if (!user || user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required"
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

// Venue member procedure - requires authentication and venue membership
export const venueMemberProcedure = protectedProcedure.use(
  async ({ ctx, next, input }) => {
    const venueId = (input as any)?.venueId;

    if (!venueId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "venueId is required",
      });
    }

    const membership = await db.query.venueMembers.findFirst({
      where: and(
        eq(venueMembers.userId, ctx.auth.userId),
        eq(venueMembers.venueId, venueId)
      ),
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this venue",
      });
    }

    return next({
      ctx: {
        ...ctx,
        venueMembership: membership,
      },
    });
  }
);

// Organizer member procedure - requires authentication and organizer membership
export const organizerMemberProcedure = protectedProcedure.use(
  async ({ ctx, next, input }) => {
    const organizerId = (input as any)?.organizerId;

    if (!organizerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "organizerId is required",
      });
    }

    const membership = await db.query.organizerMembers.findFirst({
      where: and(
        eq(organizerMembers.userId, ctx.auth.userId),
        eq(organizerMembers.organizerId, organizerId)
      ),
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organizer",
      });
    }

    return next({
      ctx: {
        ...ctx,
        organizerMembership: membership,
      },
    });
  }
);
