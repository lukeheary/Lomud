import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";
import superjson from "superjson";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

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
