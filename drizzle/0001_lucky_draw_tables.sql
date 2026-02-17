-- Lucky Draw tables migration
-- Creates: lucky_draw_entries, lucky_draw_results, lucky_draw_claims

CREATE TABLE "lucky_draw_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_id" varchar(100) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"slot_number" integer NOT NULL,
	"packs" integer NOT NULL,
	"credits_awarded" integer NOT NULL,
	"payment_platform" varchar(20) NOT NULL,
	"stripe_session_id" varchar(255),
	"amount_paid" integer,
	"currency" varchar(10),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lucky_draw_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_id" varchar(100) NOT NULL,
	"winner_slot" integer NOT NULL,
	"winner_user_id" varchar(128) NOT NULL,
	"block_number" bigint,
	"block_hash" varchar(66),
	"tx_hash" varchar(66),
	"total_slots" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lucky_draw_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_id" varchar(100) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"status" varchar(20) NOT NULL,
	"full_name" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"country" varchar(100),
	"address" text,
	"zip_code" varchar(20),
	"telegram" varchar(100),
	"carrier" varchar(100),
	"tracking_number" varchar(255),
	"tracking_url" text,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_lde_draw_id" ON "lucky_draw_entries" USING btree ("draw_id");
--> statement-breakpoint
CREATE INDEX "idx_lde_user_id" ON "lucky_draw_entries" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_lde_draw_user" ON "lucky_draw_entries" USING btree ("draw_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lde_draw_slot" ON "lucky_draw_entries" USING btree ("draw_id", "slot_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ldr_draw_id" ON "lucky_draw_results" USING btree ("draw_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ldc_draw_id" ON "lucky_draw_claims" USING btree ("draw_id");
--> statement-breakpoint
CREATE INDEX "idx_ldc_user_id" ON "lucky_draw_claims" USING btree ("user_id");
