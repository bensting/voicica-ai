-- Add device_tokens table for FCM push notification token storage

CREATE TABLE device_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE UNIQUE INDEX uq_device_tokens_token ON device_tokens(token);
