CREATE TYPE "partner_status" AS ENUM ('pending', 'accepted');
--> statement-breakpoint
CREATE TABLE "user_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_partners_requester_idx" ON "user_partners" USING btree ("requester_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_partners_recipient_idx" ON "user_partners" USING btree ("recipient_id");
--> statement-breakpoint
ALTER TABLE "user_partners" ADD CONSTRAINT "user_partners_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_partners" ADD CONSTRAINT "user_partners_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
