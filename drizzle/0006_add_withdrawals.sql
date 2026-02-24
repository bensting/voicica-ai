CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  amount NUMERIC(18,6) NOT NULL,
  fee NUMERIC(18,6) NOT NULL,
  net_amount NUMERIC(18,6) NOT NULL,
  network VARCHAR(20) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telegram VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  tx_hash VARCHAR(255),
  admin_note TEXT,
  completed_at TIMESTAMP(6) WITH TIME ZONE,
  created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals USING btree (status);
