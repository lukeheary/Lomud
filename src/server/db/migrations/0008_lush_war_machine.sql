ALTER TABLE "events" ALTER COLUMN "category" SET DEFAULT 'social';--> statement-breakpoint
ALTER TABLE "organizers" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "organizers" ADD COLUMN "state" varchar(2);--> statement-breakpoint
CREATE INDEX "organizers_location_idx" ON "organizers" USING btree ("city","state");--> statement-breakpoint
ALTER TABLE "public"."events" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_category";--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('clubs', 'bars', 'concerts', 'comedy', 'theater', 'social');--> statement-breakpoint
ALTER TABLE "public"."events" ALTER COLUMN "category" SET DATA TYPE "public"."event_category" USING "category"::"public"."event_category";