CREATE TYPE "public"."extraction_method" AS ENUM('json_ld', 'google_maps_url', 'llm', 'hashtag_match', 'geocoder');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('pending', 'extracted', 'failed', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('pinterest_pin', 'tiktok_url');--> statement-breakpoint
CREATE TABLE "extraction_result" (
	"id" uuid PRIMARY KEY NOT NULL,
	"imported_item_id" uuid NOT NULL,
	"is_place" boolean NOT NULL,
	"place_name" text,
	"address" text,
	"city" text,
	"country" text,
	"latitude" double precision,
	"longitude" double precision,
	"confidence" numeric(3, 2) NOT NULL,
	"extraction_method" "extraction_method" NOT NULL,
	"model" text,
	"raw_llm_output" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imported_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "import_source" NOT NULL,
	"source_item_id" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"link" text,
	"extraction_status" "extraction_status" DEFAULT 'pending' NOT NULL,
	"cool_place_id" uuid,
	"rejected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinterest_board" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pinterest_board_id" text NOT NULL,
	"name" text NOT NULL,
	"pin_count" integer DEFAULT 0 NOT NULL,
	"privacy" text NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinterest_connection" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pinterest_user_id" text NOT NULL,
	"pinterest_username" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extraction_result" ADD CONSTRAINT "extraction_result_imported_item_id_imported_item_id_fk" FOREIGN KEY ("imported_item_id") REFERENCES "public"."imported_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_item" ADD CONSTRAINT "imported_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_item" ADD CONSTRAINT "imported_item_cool_place_id_cool_place_id_fk" FOREIGN KEY ("cool_place_id") REFERENCES "public"."cool_place"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinterest_board" ADD CONSTRAINT "pinterest_board_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinterest_connection" ADD CONSTRAINT "pinterest_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "extractionResult_importedItemId_uniq" ON "extraction_result" USING btree ("imported_item_id");--> statement-breakpoint
CREATE INDEX "importedItem_user_source_status_idx" ON "imported_item" USING btree ("user_id","source","extraction_status");--> statement-breakpoint
CREATE UNIQUE INDEX "importedItem_user_source_sourceItemId_uniq" ON "imported_item" USING btree ("user_id","source","source_item_id");--> statement-breakpoint
CREATE INDEX "importedItem_coolPlaceId_idx" ON "imported_item" USING btree ("cool_place_id");--> statement-breakpoint
CREATE INDEX "pinterestBoard_userId_idx" ON "pinterest_board" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pinterestBoard_user_boardId_uniq" ON "pinterest_board" USING btree ("user_id","pinterest_board_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pinterestConnection_userId_uniq" ON "pinterest_connection" USING btree ("user_id");