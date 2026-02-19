ALTER TABLE "rsvps" ADD COLUMN "partner_rsvp_by_user_id" text;
--> statement-breakpoint
CREATE INDEX "rsvps_partner_rsvp_by_user_idx" ON "rsvps" USING btree ("partner_rsvp_by_user_id");
--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_partner_rsvp_by_user_id_users_id_fk" FOREIGN KEY ("partner_rsvp_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
