ALTER TABLE "events" ADD COLUMN "external_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_external_id_idx" ON "events" ("source", "external_id");
