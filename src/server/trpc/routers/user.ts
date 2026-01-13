import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { users } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";

export const userRouter = router({
  updateUsername: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Check if username is already taken by another user
      const existingUser = await ctx.db.query.users.findFirst({
        where: and(
          eq(users.username, input.username.toLowerCase()),
          ne(users.id, userId)
        ),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username is already taken",
        });
      }

      // Update the user's username
      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          username: input.username.toLowerCase(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username",
        });
      }

      return updatedUser;
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),
});
