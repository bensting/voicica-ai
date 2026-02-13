-- CreateTable
CREATE TABLE "cloned_voices" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "fish_model_id" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "sample_audio_url" TEXT,
    "reference_text" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'TRAINING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "cloned_voices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cloned_voices_fish_model_id_key" ON "cloned_voices"("fish_model_id");

-- CreateIndex
CREATE INDEX "ix_cloned_voices_user_id" ON "cloned_voices"("user_id");

-- CreateIndex
CREATE INDEX "ix_cloned_voices_status" ON "cloned_voices"("status");
