-- Lucky Draws instance table
-- Separates draw instances from static product config

CREATE TABLE "lucky_draws" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_id" varchar(100) NOT NULL,
	"product_id" varchar(100) NOT NULL,
	"title" varchar(255),
	"enabled" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'selling' NOT NULL,
	"total_slots" integer NOT NULL,
	"credits_per_purchase" integer NOT NULL,
	"stripe_price_cents" integer NOT NULL,
	"crypto_price_cents" integer NOT NULL,
	"contract_address" varchar(66),
	"chain_name" varchar(50),
	"block_explorer_url" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ld_draw_id" ON "lucky_draws" USING btree ("draw_id");
--> statement-breakpoint
CREATE INDEX "idx_ld_product_id" ON "lucky_draws" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX "idx_ld_enabled_status" ON "lucky_draws" USING btree ("enabled", "status");
