import { pgTable, index, uniqueIndex, varchar, text, integer, timestamp, boolean, serial, json, foreignKey, jsonb, doublePrecision, bigint } from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

// ============================================================
// Tables
// ============================================================

export const anonymousUsers = pgTable("anonymous_users", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	deviceFingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 50 }),
	userAgent: text("user_agent"),
	credits: integer().notNull(),
	totalCreditsUsed: integer("total_credits_used").notNull(),
	expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true, mode: 'string' }),
	lastUsedAt: timestamp("last_used_at", { precision: 6, withTimezone: true, mode: 'string' }),
	isAnonymous: boolean("is_anonymous").notNull(),
	convertedToUserId: varchar("converted_to_user_id", { length: 255 }),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	platform: varchar({ length: 20 }),
}, (table) => [
	index("idx_anonymous_users_converted_to_user_id").using("btree", table.convertedToUserId.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_users_device_fingerprint").using("btree", table.deviceFingerprint.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_users_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_anonymous_users_last_used_at").using("btree", table.lastUsedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_anonymous_users_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_users_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_anonymous_users_device_fingerprint").using("btree", table.deviceFingerprint.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_anonymous_users_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const taskQueue = pgTable("task_queue", {
	taskId: varchar("task_id", { length: 255 }).notNull(),
	taskType: varchar("task_type", { length: 50 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	priority: integer().notNull(),
	payload: json().notNull(),
	retryCount: integer("retry_count").notNull(),
	maxRetries: integer("max_retries").notNull(),
	workerId: varchar("worker_id", { length: 100 }),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { precision: 6, withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	timeoutSeconds: integer("timeout_seconds").notNull(),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
});

export const subscriptionHistory = pgTable("subscription_history", {
	id: serial().primaryKey().notNull(),
	subscriptionId: integer("subscription_id").notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	oldStatus: varchar("old_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }),
	stripeEventId: varchar("stripe_event_id", { length: 255 }),
	stripeEventType: varchar("stripe_event_type", { length: 100 }),
	amount: integer(),
	currency: varchar({ length: 10 }),
	creditsChange: integer("credits_change"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ix_subscription_history_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_subscription_history_event_type").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("ix_subscription_history_subscription_id").using("btree", table.subscriptionId.asc().nullsLast().op("int4_ops")),
	index("ix_subscription_history_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("subscription_history_stripe_event_id_key").using("btree", table.stripeEventId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.subscriptionId],
		foreignColumns: [userSubscriptions.id],
		name: "subscription_history_subscription_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const users = pgTable("users", {
	userId: varchar("user_id", { length: 128 }).notNull(),
	email: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	photoUrl: varchar("photo_url", { length: 500 }),
	credits: integer().notNull(),
	totalCreditsUsed: integer("total_credits_used").notNull(),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	phone: varchar({ length: 20 }),
	monthlyCredits: integer("monthly_credits").default(0).notNull(),
	monthlyCreditsResetAt: timestamp("monthly_credits_reset_at", { precision: 6, withTimezone: true, mode: 'string' }),
	authProvider: varchar("auth_provider", { length: 50 }),
	platform: varchar({ length: 20 }),
}, (table) => [
	index("idx_user_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_user_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_users_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const ttsRecords = pgTable("tts_records", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	text: text().notNull(),
	voiceName: varchar("voice_name", { length: 255 }).notNull(),
	language: varchar({ length: 20 }),
	speed: doublePrecision().notNull(),
	pitch: integer().notNull(),
	volume: integer().notNull(),
	creditsCost: integer("credits_cost").notNull(),
	characterCount: integer("character_count").notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().notNull(),
	audioUrl: text("audio_url"),
	duration: doublePrecision(),
	format: varchar({ length: 10 }).notNull(),
	errorMessage: text("error_message"),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	style: varchar({ length: 50 }),
	shareId: varchar("share_id", { length: 12 }),
	storyId: text("story_id"),
	platform: varchar({ length: 20 }),
	isPublic: boolean("is_public").default(false).notNull(),
}, (table) => [
	index("ix_tts_records_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("ix_tts_records_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_tts_records_share_id").using("btree", table.shareId.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_tts_records_task_id").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ix_tts_records_user_status_created").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "tts_records_story_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const creditHistory = pgTable("credit_history", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	amount: integer().notNull(),
	taskId: varchar("task_id", { length: 255 }),
	description: text().notNull(),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	productType: varchar("product_type", { length: 50 }),
}, (table) => [
	index("idx_credit_history_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_credit_history_product_type").using("btree", table.productType.asc().nullsLast().op("text_ops")),
	index("idx_credit_history_task_id").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("idx_credit_history_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_credit_history_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const voices = pgTable("voices", {
	name: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 50 }).notNull(),
	locale: varchar({ length: 20 }).notNull(),
	country: varchar({ length: 10 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	gender: varchar({ length: 20 }).notNull(),
	avatarUrl: text("avatar_url").notNull(),
	voiceSampleUrl: json("voice_sample_url").notNull(),
	voiceSampleText: text("voice_sample_text").notNull(),
	tags: json().notNull(),
	styleList: json("style_list").notNull(),
	isActive: boolean("is_active").notNull(),
	sortOrder: integer("sort_order").notNull(),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	displayName: varchar("display_name", { length: 100 }),
}, (table) => [
	index("ix_voices_country").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("ix_voices_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("ix_voices_locale").using("btree", table.locale.asc().nullsLast().op("text_ops")),
	index("ix_voices_locale_active").using("btree", table.locale.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("ix_voices_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("ix_voices_provider").using("btree", table.provider.asc().nullsLast().op("text_ops")),
	index("ix_voices_provider_country").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.country.asc().nullsLast().op("text_ops")),
	index("ix_voices_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("ix_voices_role_country").using("btree", table.role.asc().nullsLast().op("text_ops"), table.country.asc().nullsLast().op("text_ops")),
	index("ix_voices_sort_active").using("btree", table.sortOrder.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("uq_voices_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	userId: varchar("user_id", { length: 128 }).notNull(),
	productId: varchar("product_id", { length: 255 }).notNull(),
	productType: varchar("product_type", { length: 50 }),
	platform: varchar({ length: 50 }),
	externalTransactionId: varchar("external_transaction_id", { length: 255 }).notNull(),
	externalSubscriptionId: varchar("external_subscription_id", { length: 255 }),
	requestId: varchar("request_id", { length: 100 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	startDate: timestamp("start_date", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	creditsAllocated: integer("credits_allocated").notNull(),
	amount: integer(),
	currency: varchar({ length: 10 }),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()).notNull(),
	activatedAt: timestamp("activated_at", { precision: 6, withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { precision: 6, withTimezone: true, mode: 'string' }),
	cancellationReason: varchar("cancellation_reason", { length: 500 }),
	autoRenew: boolean("auto_renew").notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
	id: serial().primaryKey().notNull(),
}, (table) => [
	index("ix_user_subscriptions_end_date").using("btree", table.endDate.asc().nullsLast().op("timestamptz_ops")),
	index("ix_user_subscriptions_platform_ext_sub").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.externalSubscriptionId.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_platform_ext_txn").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.externalTransactionId.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_product_id").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_user_subscriptions_request_id").using("btree", table.requestId.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_status_end_date").using("btree", table.status.asc().nullsLast().op("text_ops"), table.endDate.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_user_subscriptions_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.userId],
		name: "fk_user_subscriptions_user_id_users"
	}).onDelete("cascade"),
]);

export const appReleases = pgTable("app_releases", {
	id: serial().primaryKey().notNull(),
	platform: varchar({ length: 20 }).notNull(),
	version: varchar({ length: 20 }).notNull(),
	versionCode: integer("version_code").notNull(),
	downloadUrl: text("download_url").notNull(),
	fileSize: bigint("file_size", { mode: "number" }),
	releaseNotes: text("release_notes"),
	isLatest: boolean("is_latest").default(false).notNull(),
	isForceUpdate: boolean("is_force_update").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	downloadCount: integer("download_count").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("app_releases_platform_version_key").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.version.asc().nullsLast().op("text_ops")),
	index("ix_app_releases_platform_active").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("ix_app_releases_platform_latest").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.isLatest.asc().nullsLast().op("text_ops")),
	index("ix_app_releases_platform_version_code").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.versionCode.asc().nullsLast().op("int4_ops")),
]);

export const userEvents = pgTable("user_events", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	event: varchar({ length: 100 }).notNull(),
	data: jsonb(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ix_user_events_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_user_events_event").using("btree", table.event.asc().nullsLast().op("text_ops")),
	index("ix_user_events_user_event").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.event.asc().nullsLast().op("text_ops")),
	index("ix_user_events_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const dailyTasks = pgTable("daily_tasks", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	date: varchar({ length: 10 }).notNull(),
	checkinDone: boolean("checkin_done").default(false).notNull(),
	checkinCredits: integer("checkin_credits").default(0).notNull(),
	adRewardsClaimed: integer("ad_rewards_claimed").default(0).notNull(),
	adRewardsCredits: integer("ad_rewards_credits").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_daily_tasks_date").using("btree", table.date.asc().nullsLast().op("text_ops")),
	index("ix_daily_tasks_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_daily_tasks_user_date").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
]);

export const adRewardTransactions = pgTable("ad_reward_transactions", {
	id: serial().primaryKey().notNull(),
	transactionId: varchar("transaction_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	tier: integer(),
	timestamp: timestamp({ precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	adUnit: varchar("ad_unit", { length: 100 }),
	rewardAmount: integer("reward_amount").default(0).notNull(),
	processed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("ad_reward_transactions_transaction_id_key").using("btree", table.transactionId.asc().nullsLast().op("text_ops")),
	index("ix_ad_reward_transactions_processed").using("btree", table.processed.asc().nullsLast().op("bool_ops")),
	index("ix_ad_reward_transactions_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	index("ix_ad_reward_transactions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const stories = pgTable("stories", {
	id: text().primaryKey().notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	keywords: varchar({ length: 500 }),
	ideaTitle: varchar("idea_title", { length: 500 }),
	ideaDescription: text("idea_description"),
	locale: varchar({ length: 20 }).default('en-US').notNull(),
	wordCount: integer("word_count").default(0).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	videoUrl: text("video_url"),
	videoStatus: varchar("video_status", { length: 20 }).default('none').notNull(),
	videoDuration: integer("video_duration"),
	videoThumbnail: text("video_thumbnail"),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	characterDescriptions: text("character_descriptions"),
}, (table) => [
	index("ix_stories_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_stories_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_stories_user_created").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_stories_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_stories_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
]);

export const rvcVoiceModels = pgTable("rvc_voice_models", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	avatarUrl: text("avatar_url"),
	sampleUrl: text("sample_url"),
	modelUrl: text("model_url").notNull(),
	indexUrl: text("index_url"),
	usesCount: integer("uses_count").default(0).notNull(),
	isBuiltin: boolean("is_builtin").default(false).notNull(),
	builtinName: varchar("builtin_name", { length: 50 }),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_rvc_voice_models_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("ix_rvc_voice_models_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("ix_rvc_voice_models_is_builtin").using("btree", table.isBuiltin.asc().nullsLast().op("bool_ops")),
	index("ix_rvc_voice_models_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	uniqueIndex("rvc_voice_models_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const storyIllustrations = pgTable("story_illustrations", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	imageUrl: text("image_url"),
	prompt: text(),
	position: integer().default(0).notNull(),
	paragraph: integer(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	creditsCost: integer("credits_cost").default(0).notNull(),
	errorMessage: text("error_message"),
	height: integer().default(1024).notNull(),
	model: varchar({ length: 100 }),
	sceneDescription: text("scene_description"),
	taskId: varchar("task_id", { length: 255 }),
	type: varchar({ length: 20 }).default('scene').notNull(),
	width: integer().default(1024).notNull(),
}, (table) => [
	index("ix_story_illustrations_position").using("btree", table.position.asc().nullsLast().op("int4_ops")),
	index("ix_story_illustrations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_story_illustrations_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("ix_story_illustrations_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "story_illustrations_story_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const storyParagraphs = pgTable("story_paragraphs", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	position: integer().default(0).notNull(),
	content: text().notNull(),
	audioUrl: text("audio_url"),
	audioDuration: doublePrecision("audio_duration"),
	audioVoice: varchar("audio_voice", { length: 255 }),
	audioStatus: varchar("audio_status", { length: 20 }).default('none').notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	illustrationPrompt: text("illustration_prompt"),
	illustrationStatus: varchar("illustration_status", { length: 20 }).default('none').notNull(),
	illustrationUrl: text("illustration_url"),
}, (table) => [
	index("ix_story_paragraphs_position").using("btree", table.position.asc().nullsLast().op("int4_ops")),
	index("ix_story_paragraphs_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_story_paragraphs_story_position").using("btree", table.storyId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "story_paragraphs_story_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const coverRecords = pgTable("cover_records", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	originalAudioUrl: text("original_audio_url").notNull(),
	voiceModelId: integer("voice_model_id").notNull(),
	voiceModelName: varchar("voice_model_name", { length: 100 }).notNull(),
	pitchChange: integer("pitch_change").default(0).notNull(),
	f0Method: varchar("f0_method", { length: 20 }).default('rmvpe').notNull(),
	indexRate: doublePrecision("index_rate").default(0.5).notNull(),
	protect: doublePrecision().default(0.33).notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	spleeterTaskId: varchar("spleeter_task_id", { length: 255 }),
	rvcTaskId: varchar("rvc_task_id", { length: 255 }),
	vocalsUrl: text("vocals_url"),
	accompanimentUrl: text("accompaniment_url"),
	convertedVocalsUrl: text("converted_vocals_url"),
	outputUrl: text("output_url"),
	duration: doublePrecision(),
	creditsCost: integer("credits_cost").notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	errorMessage: text("error_message"),
	shareId: varchar("share_id", { length: 12 }),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("cover_records_share_id_key").using("btree", table.shareId.asc().nullsLast().op("text_ops")),
	uniqueIndex("cover_records_task_id_key").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_cover_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_cover_records_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_cover_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_cover_records_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ix_cover_records_voice_model_id").using("btree", table.voiceModelId.asc().nullsLast().op("int4_ops")),
]);

export const shareLinks = pgTable("share_links", {
	id: serial().primaryKey().notNull(),
	token: varchar({ length: 32 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }).notNull(),
	resourceId: varchar("resource_id", { length: 100 }).notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ix_share_links_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_share_links_resource").using("btree", table.resourceType.asc().nullsLast().op("text_ops"), table.resourceId.asc().nullsLast().op("text_ops")),
	index("ix_share_links_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("ix_share_links_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("share_links_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
]);

export const videoRecords = pgTable("video_records", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	taskType: varchar("task_type", { length: 50 }).notNull(),
	model: varchar({ length: 50 }).notNull(),
	prompt: text().notNull(),
	promptZh: text("prompt_zh"),
	negativePrompt: text("negative_prompt"),
	resolution: varchar({ length: 20 }).notNull(),
	duration: integer().notNull(),
	aspectRatio: varchar("aspect_ratio", { length: 10 }).notNull(),
	seed: integer(),
	isPublic: boolean("is_public").default(false).notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	videoUrl: text("video_url"),
	thumbnailUrl: text("thumbnail_url"),
	actualDuration: doublePrecision("actual_duration"),
	format: varchar({ length: 10 }).default('mp4').notNull(),
	errorMessage: text("error_message"),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	shareId: varchar("share_id", { length: 12 }),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	apiCost: doublePrecision("api_cost"),
	viewCount: integer("view_count").default(0).notNull(),
	externalTaskId: varchar("external_task_id", { length: 255 }),
}, (table) => [
	index("ix_video_records_external_task_id").using("btree", table.externalTaskId.asc().nullsLast().op("text_ops")),
	index("ix_video_records_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	uniqueIndex("ix_video_records_share_id").using("btree", table.shareId.asc().nullsLast().op("text_ops")),
	index("ix_video_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_video_records_task_id").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_video_records_user_created").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_video_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_video_records_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ix_video_records_user_status_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
]);

export const imageRecords = pgTable("image_records", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
	prompt: text().notNull(),
	aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull(),
	quality: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	imageUrl: text("image_url"),
	isPublic: boolean("is_public").default(false).notNull(),
	creditsUsed: integer("credits_used").notNull(),
	error: text(),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("image_records_task_id_key").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_image_records_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("ix_image_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_image_records_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_image_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_image_records_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
]);

export const musicRecords = pgTable("music_records", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	externalTaskId: varchar("external_task_id", { length: 255 }),
	model: varchar({ length: 50 }).notNull(),
	prompt: text().notNull(),
	style: varchar({ length: 500 }),
	title: varchar({ length: 200 }),
	lyrics: text(),
	isInstrumental: boolean("is_instrumental").default(false).notNull(),
	isCustomMode: boolean("is_custom_mode").default(false).notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	audioUrl: text("audio_url"),
	audioUrl2: text("audio_url_2"),
	streamUrl: text("stream_url"),
	streamUrl2: text("stream_url_2"),
	coverUrl: text("cover_url"),
	coverUrl2: text("cover_url_2"),
	duration: doublePrecision(),
	duration2: doublePrecision("duration_2"),
	tags: varchar({ length: 500 }),
	errorMessage: text("error_message"),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	shareId: varchar("share_id", { length: 12 }),
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	externalTrackId: varchar("external_track_id", { length: 255 }),
	externalTrackId2: varchar("external_track_id_2", { length: 255 }),
}, (table) => [
	index("ix_music_records_external_task_id").using("btree", table.externalTaskId.asc().nullsLast().op("text_ops")),
	index("ix_music_records_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	uniqueIndex("ix_music_records_share_id").using("btree", table.shareId.asc().nullsLast().op("text_ops")),
	index("ix_music_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_music_records_task_id").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_music_records_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_music_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_music_records_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
]);

export const dialogueRecords = pgTable("dialogue_records", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	externalTaskId: varchar("external_task_id", { length: 255 }),
	dialogueJson: text("dialogue_json").notNull(),
	totalCharacters: integer("total_characters").notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	audioUrl: text("audio_url"),
	duration: doublePrecision(),
	errorMessage: text("error_message"),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
	isPublic: boolean("is_public").default(false).notNull(),
}, (table) => [
	uniqueIndex("dialogue_records_task_id_key").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("ix_dialogue_records_external_task_id").using("btree", table.externalTaskId.asc().nullsLast().op("text_ops")),
	index("ix_dialogue_records_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("ix_dialogue_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_dialogue_records_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_dialogue_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const nativeBanners = pgTable("native_banners", {
	id: serial().primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	linkUrl: text("link_url"),
	titles: json().notNull(),
	subtitles: json().notNull(),
	buttonTexts: json("button_texts"),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_native_banners_active_sort").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const videoDownloadRecords = pgTable("video_download_records", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	url: text().notNull(),
	platform: varchar({ length: 50 }),
	videoTitle: text("video_title"),
	videoAuthor: text("video_author"),
	status: varchar({ length: 20 }).notNull(),
	errorCode: varchar("error_code", { length: 50 }),
	creditsCost: integer("credits_cost").default(0).notNull(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ix_video_download_records_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_video_download_records_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	index("ix_video_download_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_video_download_records_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const imageToolRecords = pgTable("image_tool_records", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	taskId: varchar("task_id", { length: 255 }).notNull(),
	toolType: varchar("tool_type", { length: 30 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	progress: integer().default(0).notNull(),
	originalImageUrl: text("original_image_url").notNull(),
	resultImageUrl: text("result_image_url"),
	creditsUsed: integer("credits_used").notNull(),
	error: text(),
	completedAt: timestamp("completed_at", { precision: 6, withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("image_tool_records_task_id_key").using("btree", table.taskId.asc().nullsLast()),
	index("ix_image_tool_records_user_id").using("btree", table.userId.asc().nullsLast()),
]);

export const clonedVoices = pgTable("cloned_voices", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	fishModelId: varchar("fish_model_id", { length: 255 }).notNull(),
	description: text(),
	coverImageUrl: text("cover_image_url"),
	sampleAudioUrl: text("sample_audio_url"),
	referenceText: text("reference_text"),
	status: varchar({ length: 20 }).default('TRAINING').notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true, mode: 'string' }).$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_cloned_voices_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("ix_cloned_voices_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("ix_cloned_voices_fish_model_id").using("btree", table.fishModelId.asc().nullsLast().op("text_ops")),
]);

// ============================================================
// Lucky Draw Tables
// ============================================================

/** 抽奖实例 — admin 创建，引用产品配置的 productId */
export const luckyDrawInstances = pgTable("lucky_draws", {
	id: serial().primaryKey().notNull(),
	drawId: varchar("draw_id", { length: 100 }).notNull(),
	productId: varchar("product_id", { length: 100 }).notNull(),
	prizeType: varchar("prize_type", { length: 20 }),
	title: varchar("title", { length: 255 }),
	enabled: boolean("enabled").default(false).notNull(),
	status: varchar("status", { length: 20 }).default('selling').notNull(),
	totalSlots: integer("total_slots").notNull(),
	soldCount: integer("sold_count").default(0).notNull(),
	creditsPerPurchase: integer("credits_per_purchase").notNull(),
	stripePriceCents: integer("stripe_price_cents").notNull(),
	cryptoPriceCents: integer("crypto_price_cents").notNull(),
	contractAddress: varchar("contract_address", { length: 66 }),
	chainName: varchar("chain_name", { length: 50 }),
	blockExplorerUrl: text("block_explorer_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("uq_ld_draw_id").using("btree", table.drawId),
	index("idx_ld_product_id").using("btree", table.productId),
	index("idx_ld_enabled_status").using("btree", table.enabled, table.status),
]);

export const luckyDrawEntries = pgTable("lucky_draw_entries", {
	id: serial().primaryKey().notNull(),
	drawId: varchar("draw_id", { length: 100 }).notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	slotNumber: integer("slot_number").notNull(),
	packs: integer("packs").notNull(),
	creditsAwarded: integer("credits_awarded").notNull(),
	paymentPlatform: varchar("payment_platform", { length: 20 }).notNull(),
	status: varchar("status", { length: 20 }).default('paid').notNull(),
	stripeSessionId: varchar("stripe_session_id", { length: 255 }),
	amountPaid: integer("amount_paid"),
	currency: varchar("currency", { length: 10 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_lde_draw_id").using("btree", table.drawId),
	index("idx_lde_user_id").using("btree", table.userId),
	index("idx_lde_draw_user").using("btree", table.drawId, table.userId),
	uniqueIndex("uq_lde_draw_slot").using("btree", table.drawId, table.slotNumber),
]);

export const luckyDrawResults = pgTable("lucky_draw_results", {
	id: serial().primaryKey().notNull(),
	drawId: varchar("draw_id", { length: 100 }).notNull(),
	winnerSlot: integer("winner_slot").notNull(),
	winnerUserId: varchar("winner_user_id", { length: 128 }).notNull(),
	blockNumber: bigint("block_number", { mode: 'number' }),
	blockHash: varchar("block_hash", { length: 66 }),
	txHash: varchar("tx_hash", { length: 66 }),
	totalSlots: integer("total_slots").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("uq_ldr_draw_id").using("btree", table.drawId),
]);

export const luckyDrawClaims = pgTable("lucky_draw_claims", {
	id: serial().primaryKey().notNull(),
	drawId: varchar("draw_id", { length: 100 }).notNull(),
	userId: varchar("user_id", { length: 128 }).notNull(),
	status: varchar("status", { length: 20 }).notNull(),
	fullName: varchar("full_name", { length: 255 }),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 255 }),
	country: varchar("country", { length: 100 }),
	address: text("address"),
	zipCode: varchar("zip_code", { length: 20 }),
	telegram: varchar("telegram", { length: 100 }),
	carrier: varchar("carrier", { length: 100 }),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	trackingUrl: text("tracking_url"),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' })
		.$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("uq_ldc_draw_id").using("btree", table.drawId),
	index("idx_ldc_user_id").using("btree", table.userId),
]);

// ============================================================
// Relations
// ============================================================

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({one}) => ({
	userSubscription: one(userSubscriptions, {
		fields: [subscriptionHistory.subscriptionId],
		references: [userSubscriptions.id]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one, many}) => ({
	subscriptionHistories: many(subscriptionHistory),
	user: one(users, {
		fields: [userSubscriptions.userId],
		references: [users.userId]
	}),
}));

export const ttsRecordsRelations = relations(ttsRecords, ({one}) => ({
	story: one(stories, {
		fields: [ttsRecords.storyId],
		references: [stories.id]
	}),
}));

export const storiesRelations = relations(stories, ({many}) => ({
	ttsRecords: many(ttsRecords),
	storyIllustrations: many(storyIllustrations),
	storyParagraphs: many(storyParagraphs),
}));

export const usersRelations = relations(users, ({many}) => ({
	userSubscriptions: many(userSubscriptions),
}));

export const storyIllustrationsRelations = relations(storyIllustrations, ({one}) => ({
	story: one(stories, {
		fields: [storyIllustrations.storyId],
		references: [stories.id]
	}),
}));

export const storyParagraphsRelations = relations(storyParagraphs, ({one}) => ({
	story: one(stories, {
		fields: [storyParagraphs.storyId],
		references: [stories.id]
	}),
}));
