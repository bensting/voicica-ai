CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_account_unique` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `anonymous_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`device_fingerprint` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`credits` integer NOT NULL,
	`total_credits_used` integer NOT NULL,
	`expires_at` integer,
	`last_used_at` integer,
	`is_anonymous` integer NOT NULL,
	`converted_to_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anonymous_users_user_id_unique` ON `anonymous_users` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `anonymous_users_device_fingerprint_unique` ON `anonymous_users` (`device_fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_anonymous_users_user_id` ON `anonymous_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_anonymous_users_device_fingerprint` ON `anonymous_users` (`device_fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_anonymous_users_expires_at` ON `anonymous_users` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_anonymous_users_last_used_at` ON `anonymous_users` (`last_used_at`);--> statement-breakpoint
CREATE INDEX `idx_anonymous_users_converted_to_user_id` ON `anonymous_users` (`converted_to_user_id`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`email_verified` integer,
	`image` text,
	`app_user_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_app_user_id_unique` ON `auth_users` (`app_user_id`);--> statement-breakpoint
CREATE TABLE `configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`config_type` text,
	`version` integer NOT NULL,
	`is_active` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configs_key_unique` ON `configs` (`key`);--> statement-breakpoint
CREATE INDEX `ix_configs_config_type` ON `configs` (`config_type`);--> statement-breakpoint
CREATE INDEX `ix_configs_is_active` ON `configs` (`is_active`);--> statement-breakpoint
CREATE TABLE `credit_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`task_id` text,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_credit_history_user_id` ON `credit_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_credit_history_task_id` ON `credit_history` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_credit_history_created_at` ON `credit_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_credit_history_user_created` ON `credit_history` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `subscription_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscription_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`old_status` text,
	`new_status` text,
	`stripe_event_id` text,
	`stripe_event_type` text,
	`amount` integer,
	`currency` text,
	`credits_change` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_history_stripe_event_id_unique` ON `subscription_history` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `ix_subscription_history_subscription_id` ON `subscription_history` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `ix_subscription_history_user_id` ON `subscription_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_subscription_history_event_type` ON `subscription_history` (`event_type`);--> statement-breakpoint
CREATE INDEX `ix_subscription_history_created_at` ON `subscription_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`product_type` text NOT NULL,
	`product_id` text NOT NULL,
	`base_plan_id` text,
	`plan_name` text NOT NULL,
	`display_name` text NOT NULL,
	`features` text NOT NULL,
	`credits_per_cycle` integer NOT NULL,
	`cycle_days` integer NOT NULL,
	`active` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`price` text NOT NULL,
	`discounted_price` text NOT NULL,
	`billing_period` text NOT NULL,
	`enable_first_month_coupon` integer NOT NULL,
	`first_month_coupon_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_subscription_plans_platform` ON `subscription_plans` (`platform`);--> statement-breakpoint
CREATE INDEX `ix_subscription_plans_product_id` ON `subscription_plans` (`product_id`);--> statement-breakpoint
CREATE INDEX `ix_subscription_plans_active` ON `subscription_plans` (`active`);--> statement-breakpoint
CREATE TABLE `task_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` text NOT NULL,
	`task_type` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`priority` integer NOT NULL,
	`payload` text NOT NULL,
	`retry_count` integer NOT NULL,
	`max_retries` integer NOT NULL,
	`worker_id` text,
	`error_message` text,
	`started_at` integer,
	`completed_at` integer,
	`timeout_seconds` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tts_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`text` text NOT NULL,
	`voice_name` text NOT NULL,
	`language` text,
	`speed` real NOT NULL,
	`pitch` integer NOT NULL,
	`volume` integer NOT NULL,
	`credits_cost` integer NOT NULL,
	`character_count` integer NOT NULL,
	`status` text NOT NULL,
	`progress` integer NOT NULL,
	`audio_url` text,
	`duration` real,
	`format` text NOT NULL,
	`error_message` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tts_records_task_id_unique` ON `tts_records` (`task_id`);--> statement-breakpoint
CREATE INDEX `ix_tts_records_user_id` ON `tts_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_tts_records_status` ON `tts_records` (`status`);--> statement-breakpoint
CREATE INDEX `ix_tts_records_user_created` ON `tts_records` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_tts_records_user_status` ON `tts_records` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `ix_tts_records_user_status_created` ON `tts_records` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`subscription_plan_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`product_type` text,
	`platform` text,
	`external_transaction_id` text NOT NULL,
	`external_subscription_id` text,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`credits_allocated` integer NOT NULL,
	`amount` integer,
	`currency` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`activated_at` integer,
	`cancelled_at` integer,
	`cancellation_reason` text,
	`auto_renew` integer NOT NULL,
	`cancel_at_period_end` integer NOT NULL,
	FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_subscriptions_request_id_unique` ON `user_subscriptions` (`request_id`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_user_id` ON `user_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_status` ON `user_subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_end_date` ON `user_subscriptions` (`end_date`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_user_status` ON `user_subscriptions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_status_end_date` ON `user_subscriptions` (`status`,`end_date`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_platform_ext_sub` ON `user_subscriptions` (`platform`,`external_subscription_id`);--> statement-breakpoint
CREATE INDEX `ix_user_subscriptions_platform_ext_txn` ON `user_subscriptions` (`platform`,`external_transaction_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email` text,
	`name` text,
	`photo_url` text,
	`credits` integer NOT NULL,
	`total_credits_used` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_id_unique` ON `users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `identifier_token_unique` ON `verification_tokens` (`identifier`,`token`);--> statement-breakpoint
CREATE TABLE `voices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`provider` text NOT NULL,
	`locale` text NOT NULL,
	`country` text NOT NULL,
	`role` text NOT NULL,
	`gender` text NOT NULL,
	`avatar_url` text NOT NULL,
	`voice_sample_url` text NOT NULL,
	`voice_sample_text` text NOT NULL,
	`tags` text NOT NULL,
	`style_list` text NOT NULL,
	`is_active` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voices_name_unique` ON `voices` (`name`);--> statement-breakpoint
CREATE INDEX `ix_voices_name` ON `voices` (`name`);--> statement-breakpoint
CREATE INDEX `ix_voices_provider` ON `voices` (`provider`);--> statement-breakpoint
CREATE INDEX `ix_voices_locale` ON `voices` (`locale`);--> statement-breakpoint
CREATE INDEX `ix_voices_country` ON `voices` (`country`);--> statement-breakpoint
CREATE INDEX `ix_voices_role` ON `voices` (`role`);--> statement-breakpoint
CREATE INDEX `ix_voices_is_active` ON `voices` (`is_active`);--> statement-breakpoint
CREATE INDEX `ix_voices_locale_active` ON `voices` (`locale`,`is_active`);--> statement-breakpoint
CREATE INDEX `ix_voices_provider_country` ON `voices` (`provider`,`country`);--> statement-breakpoint
CREATE INDEX `ix_voices_role_country` ON `voices` (`role`,`country`);--> statement-breakpoint
CREATE INDEX `ix_voices_sort_active` ON `voices` (`sort_order`,`is_active`);