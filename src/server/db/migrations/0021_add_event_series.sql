CREATE TYPE "recurrence_frequency" AS ENUM ('daily', 'weekly');
--> statement-breakpoint
CREATE TABLE "event_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid,
	"organizer_id" uuid,
	"created_by_user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_url" text,
	"event_url" text,
	"source" varchar(50),
	"external_id" text,
	"start_at" timestamp NOT NULL,
	"duration_minutes" integer,
	"venue_name" varchar(255),
	"address" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" "event_visibility" DEFAULT 'public' NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" jsonb,
	"until_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "series_id" uuid;
--> statement-breakpoint
CREATE INDEX "event_series_venue_idx" ON "event_series" USING btree ("venue_id");
--> statement-breakpoint
CREATE INDEX "event_series_organizer_idx" ON "event_series" USING btree ("organizer_id");
--> statement-breakpoint
CREATE INDEX "event_series_start_at_idx" ON "event_series" USING btree ("start_at");
--> statement-breakpoint
CREATE INDEX "event_series_active_idx" ON "event_series" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "event_series_location_idx" ON "event_series" USING btree ("city","state");
--> statement-breakpoint
CREATE INDEX "events_series_idx" ON "events" USING btree ("series_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "events_series_start_at_unique_idx" ON "events" USING btree ("series_id","start_at");
--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_venue_id_places_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_organizer_id_places_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;
