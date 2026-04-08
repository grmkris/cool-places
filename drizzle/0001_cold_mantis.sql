ALTER TABLE "verification" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "coolPlace_tags_gin_idx" ON "cool_place" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "coolPlace_public_created_idx" ON "cool_place" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "placeVisit_unique_visit_idx" ON "place_visit" USING btree ("place_id","user_id","visited_at");