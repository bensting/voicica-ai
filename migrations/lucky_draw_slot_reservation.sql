-- Lucky Draw: Slot reservation mechanism to prevent overselling
-- Run this migration against your database before deploying the new code.

-- 1. Add sold_count counter to lucky_draws (tracks reserved + paid slots)
ALTER TABLE lucky_draws ADD COLUMN sold_count INTEGER NOT NULL DEFAULT 0;

-- Backfill sold_count from existing entries
UPDATE lucky_draws ld SET sold_count = (
  SELECT COUNT(*) FROM lucky_draw_entries lde WHERE lde.draw_id = ld.draw_id
);

-- 2. Add status column to lucky_draw_entries ('reserved' or 'paid')
ALTER TABLE lucky_draw_entries ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'paid';
-- Existing rows get 'paid' via DEFAULT — no extra UPDATE needed.
