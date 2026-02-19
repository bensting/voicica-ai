CREATE TABLE IF NOT EXISTS "image_tool_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "task_id" varchar(255) NOT NULL,
  "tool_type" varchar(30) NOT NULL,
  "status" varchar(20) NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "original_image_url" text NOT NULL,
  "result_image_url" text,
  "credits_used" integer NOT NULL,
  "error" text,
  "completed_at" timestamp(6) with time zone,
  "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "image_tool_records_task_id_key" ON "image_tool_records" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "ix_image_tool_records_user_id" ON "image_tool_records" USING btree ("user_id");
