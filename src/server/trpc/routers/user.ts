import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { users, venueMembers, organizerMembers } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export const userRouter = router({
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.auth.userId),
    });

    return {
      isAdmin: user?.role === "admin",
    };
  }),

  hasVenues: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.venueMembers.findMany({
      where: eq(venueMembers.userId, ctx.auth.userId),
      limit: 1,
    });

    return memberships.length > 0;
  }),

  hasOrganizers: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.organizerMembers.findMany({
      where: eq(organizerMembers.userId, ctx.auth.userId),
      limit: 1,
    });

    return memberships.length > 0;
  }),

  updateUsername: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        city: z.string().optional(),
        state: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        imageUrl: z.string().optional(),
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

      // Build update object
      const updateData: Record<string, any> = {
        username: input.username.toLowerCase(),
        updatedAt: new Date(),
        isOnboarding: false, // Mark onboarding as complete
      };

      if (input.city) {
        updateData.city = input.city;
      }
      if (input.state) {
        updateData.state = input.state;
      }
      if (input.gender) {
        updateData.gender = input.gender;
      }
      if (input.imageUrl) {
        updateData.imageUrl = input.imageUrl;
      }

      // Update the user's username and location
      const [updatedUser] = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username",
        });
      }

      // Update Clerk's public metadata to mark onboarding as complete
      // This allows middleware to check onboarding status
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          isOnboarding: false,
        },
      });

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

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        imageUrl: z.string().url().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      console.log("updateProfile called for user:", userId);
      console.log("Input data:", input);

      // Build update object with only provided fields
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.firstName !== undefined) {
        updateData.firstName = input.firstName;
      }
      if (input.lastName !== undefined) {
        updateData.lastName = input.lastName;
      }
      if (input.imageUrl !== undefined) {
        updateData.imageUrl = input.imageUrl;
      }
      if (input.city !== undefined) {
        updateData.city = input.city;
      }
      if (input.state !== undefined) {
        updateData.state = input.state;
      }
      if (input.gender !== undefined) {
        updateData.gender = input.gender;
      }

      console.log("Updating database with:", updateData);

      // Update in our database
      const [updatedUser] = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }

      console.log("Database updated successfully:", {
        id: updatedUser.id,
        imageUrl: updatedUser.imageUrl,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        city: updatedUser.city,
        state: updatedUser.state,
      });

      // Sync with Clerk (firstName and lastName only, not imageUrl as we use S3)
      try {
        const client = await clerkClient();
        const clerkUpdateData: Record<string, any> = {};

        if (input.firstName !== undefined) {
          clerkUpdateData.firstName = input.firstName;
        }
        if (input.lastName !== undefined) {
          clerkUpdateData.lastName = input.lastName;
        }

        // Update Clerk user metadata (excluding imageUrl)
        if (Object.keys(clerkUpdateData).length > 0) {
          await client.users.updateUser(userId, clerkUpdateData);
        }
      } catch (error) {
        console.error("Error syncing with Clerk:", error);
        // Don't throw - we've already updated our DB
      }

      return updatedUser;
    }),
});
