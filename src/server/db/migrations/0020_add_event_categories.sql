CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_categories_event_category_idx" ON "event_categories" USING btree ("event_id","category_id");
--> statement-breakpoint
CREATE INDEX "event_categories_event_idx" ON "event_categories" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "event_categories_category_idx" ON "event_categories" USING btree ("category_id");
--> statement-breakpoint
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "event_categories" ("event_id", "category_id")
SELECT
	e."id" AS "event_id",
	c."id" AS "category_id"
FROM "events" e
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e."categories", '[]'::jsonb)) AS key(value)
INNER JOIN "categories" c ON c."key" = key.value
ON CONFLICT ("event_id", "category_id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "categories";
