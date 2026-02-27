-- Add push_notification_logs table for tracking sent push notifications

CREATE TABLE push_notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  target_user_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  total_devices INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_push_logs_created_at ON push_notification_logs(created_at);
