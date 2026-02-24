-- Add usdt_balance column to users table
ALTER TABLE users ADD COLUMN usdt_balance NUMERIC(18,6) DEFAULT 0 NOT NULL;

-- Create conversions table
CREATE TABLE conversions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  type VARCHAR(20) NOT NULL,
  voicica_amount INTEGER NOT NULL,
  usdt_amount NUMERIC(18,6) NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_conversions_user_id ON conversions USING btree (user_id);
