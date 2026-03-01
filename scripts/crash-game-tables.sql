-- Crash Game Tables
-- Run: wrangler d1 execute <DB_NAME> --file=scripts/crash-game-tables.sql

CREATE TABLE IF NOT EXISTS crash_game_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  bet_amount REAL NOT NULL,
  seed TEXT NOT NULL,
  seed_hash TEXT NOT NULL,
  crash_point REAL NOT NULL,
  cash_out_multiplier REAL,
  profit REAL,
  status TEXT NOT NULL DEFAULT 'active',
  speed REAL NOT NULL,
  started_at TEXT NOT NULL,
  cashed_out_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crash_game_rounds_round_id ON crash_game_rounds(round_id);
CREATE INDEX IF NOT EXISTS idx_crash_game_rounds_user_id ON crash_game_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_crash_game_rounds_user_created ON crash_game_rounds(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_crash_game_rounds_status ON crash_game_rounds(status);
CREATE INDEX IF NOT EXISTS idx_crash_game_rounds_created_at ON crash_game_rounds(created_at);

CREATE TABLE IF NOT EXISTS crash_game_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER NOT NULL DEFAULT 0,
  min_bet REAL NOT NULL DEFAULT 1,
  max_bet REAL NOT NULL DEFAULT 1000,
  house_edge_percent REAL NOT NULL DEFAULT 3,
  speed REAL NOT NULL DEFAULT 0.00006,
  max_duration_seconds INTEGER NOT NULL DEFAULT 120,
  grace_period_ms INTEGER NOT NULL DEFAULT 300,
  updated_at TEXT
);

-- Insert default config row
INSERT OR IGNORE INTO crash_game_config (id, enabled, min_bet, max_bet, house_edge_percent, speed, max_duration_seconds, grace_period_ms)
VALUES (1, 0, 1, 1000, 3, 0.00006, 120, 300);
