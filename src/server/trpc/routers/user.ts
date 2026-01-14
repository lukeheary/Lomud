import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { users } from "@/server/db/schema";
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

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        imageUrl: z.string().url().optional(),
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
      });

      // Sync with Clerk
      try {
        const client = await clerkClient();
        const clerkUpdateData: Record<string, any> = {};

        if (input.firstName !== undefined) {
          clerkUpdateData.firstName = input.firstName;
        }
        if (input.lastName !== undefined) {
          clerkUpdateData.lastName = input.lastName;
        }

        // Update Clerk user metadata
        if (Object.keys(clerkUpdateData).length > 0 || input.imageUrl) {
          await client.users.updateUser(userId, {
            ...clerkUpdateData,
            ...(input.imageUrl && {
              publicMetadata: {
                profileImageUrl: input.imageUrl,
              },
            }),
          });
        }
      } catch (error) {
        console.error("Error syncing with Clerk:", error);
        // Don't throw - we've already updated our DB
      }

      return updatedUser;
    }),

  uploadProfileImageToClerk: protectedProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      console.log("Uploading profile image to Clerk for user:", userId);
      console.log("File name:", input.fileName);

      try {
        // Convert base64 to blob
        const base64Data = input.imageData.split(",")[1]; // Remove data:image/jpeg;base64, prefix
        const mimeType = input.imageData.match(/data:([^;]+);/)?.[1] || "image/jpeg";
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: mimeType });
        const file = new File([blob], input.fileName, { type: mimeType });

        console.log("Uploading to Clerk...");

        // Update Clerk profile image
        const client = await clerkClient();
        const updatedUser = await client.users.updateUserProfileImage(userId, {
          file,
        });

        console.log("Profile image uploaded to Clerk successfully");
        console.log("Clerk image URL:", updatedUser.imageUrl);

        // Update our database with the Clerk image URL
        const [dbUser] = await ctx.db
          .update(users)
          .set({
            imageUrl: updatedUser.imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        console.log("Database updated with Clerk image URL");

        return {
          success: true,
          imageUrl: updatedUser.imageUrl,
        };
      } catch (error) {
        console.error("Error uploading profile image to Clerk:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload profile image to Clerk",
        });
      }
    }),
});
