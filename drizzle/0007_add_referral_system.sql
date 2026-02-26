-- Add referral fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_level VARCHAR(20) NOT NULL DEFAULT 'miner';

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_referral_code ON users USING btree (referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referred_by ON users USING btree (referred_by);

-- Create referral_commissions table
CREATE TABLE IF NOT EXISTS referral_commissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  from_user_id VARCHAR(128) NOT NULL,
  level VARCHAR(10) NOT NULL,
  source_amount INTEGER NOT NULL,
  commission_rate REAL NOT NULL,
  commission_amount INTEGER NOT NULL,
  created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_user_id ON referral_commissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_from_user_id ON referral_commissions USING btree (from_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_created_at ON referral_commissions USING btree (created_at);
