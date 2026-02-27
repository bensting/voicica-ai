-- 修复历史数据中的 datetime 格式
-- 将旧格式 "2026-02-27 14:56:48" 转换为 ISO 格式 "2026-02-27T14:56:48.000Z"
-- 条件: 不包含 "T" 的记录（即旧 datetime('now') 格式）
--
-- 用法: wrangler d1 execute voicica-db --remote --file=scripts/fix-datetime-format.sql

-- 修复 created_at
UPDATE anonymous_users SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE task_queue SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE subscription_history SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE users SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE tts_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE credit_history SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE voices SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE user_subscriptions SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE app_releases SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE user_events SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE daily_tasks SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE ad_reward_transactions SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE stories SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE rvc_voice_models SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE story_illustrations SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE story_paragraphs SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE cover_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE share_links SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE video_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE image_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE music_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE dialogue_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE native_banners SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE video_download_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE image_tool_records SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE cloned_voices SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE conversions SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE withdrawals SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE lucky_draws SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE lucky_draw_entries SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE lucky_draw_results SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE lucky_draw_claims SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE device_tokens SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE push_notification_logs SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE referral_commissions SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';

-- 修复 updated_at
UPDATE anonymous_users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE task_queue SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE tts_records SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE credit_history SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE voices SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE user_subscriptions SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE device_tokens SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
