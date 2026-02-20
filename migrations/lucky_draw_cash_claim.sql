-- Lucky Draw: Add wallet info columns for cash-type prize claims (USDT etc.)
-- Run this migration against your database before deploying.

ALTER TABLE lucky_draw_claims ADD COLUMN wallet_network VARCHAR(50);
ALTER TABLE lucky_draw_claims ADD COLUMN wallet_address VARCHAR(255);
