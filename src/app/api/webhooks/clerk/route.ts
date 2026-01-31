import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } =
      evt.data;
    
    // Check if the user has a real image (Clerk default images should be ignored)
    // @ts-ignore - has_image might not be in the typings but is in the payload
    const hasRealImage = evt.data.has_image === true;
    const finalImageUrl = hasRealImage ? image_url : null;

    // For new users, use a temporary username that will be updated during onboarding
    // For existing users being updated, preserve their current username
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    const finalUsername = existingUser
      ? existingUser.username
      : username || `user_${id.slice(-8)}`;

    await db
      .insert(users)
      .values({
        id,
        email: email_addresses[0].email_address,
        username: finalUsername,
        firstName: first_name,
        lastName: last_name,
        imageUrl: finalImageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: email_addresses[0].email_address,
          // Only update username if Clerk provides one, otherwise keep existing
          ...(username ? { username } : {}),
          firstName: first_name,
          lastName: last_name,
          // Only overwrite imageUrl if the new one is a real image and the current one is either 
          // missing or a Clerk default (S3/User-uploaded images should be preserved)
          ...(finalImageUrl && (!existingUser?.imageUrl || existingUser.imageUrl.includes("clerk.com/default-user-image")) 
            ? { imageUrl: finalImageUrl } 
            : {}),
          updatedAt: new Date(),
        },
      });

    // For new users, set isOnboarding: true in Clerk's public metadata
    // This allows middleware to redirect them to onboarding
    if (!existingUser) {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          isOnboarding: true,
        },
      });
    }

    console.log(`✅ User ${id} synced to database`);
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await db.delete(users).where(eq(users.id, id));
      console.log(`✅ User ${id} deleted from database`);
    }
  }

  return new Response("", { status: 200 });
}
