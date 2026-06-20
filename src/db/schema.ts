import { sqliteTable, index, uniqueIndex, text, integer, foreignKey, real } from "drizzle-orm/sqlite-core"
import { relations, sql } from "drizzle-orm"

// ============================================================
// Tables
// ============================================================

export const anonymousUsers = sqliteTable("anonymous_users", {
	userId: text("user_id").notNull(),
	deviceFingerprint: text("device_fingerprint").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	credits: real("credits").notNull(),
	totalCreditsUsed: real("total_credits_used").notNull(),
	expiresAt: text("expires_at"),
	lastUsedAt: text("last_used_at"),
	isAnonymous: integer("is_anonymous", { mode: 'boolean' }).notNull(),
	convertedToUserId: text("converted_to_user_id"),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	platform: text("platform"),
}, (table) => [
	index("idx_anonymous_users_converted_to_user_id").on(table.convertedToUserId),
	index("idx_anonymous_users_device_fingerprint").on(table.deviceFingerprint),
	index("idx_anonymous_users_expires_at").on(table.expiresAt),
	index("idx_anonymous_users_last_used_at").on(table.lastUsedAt),
	index("idx_anonymous_users_platform").on(table.platform),
	index("idx_anonymous_users_user_id").on(table.userId),
	uniqueIndex("uq_anonymous_users_device_fingerprint").on(table.deviceFingerprint),
	uniqueIndex("uq_anonymous_users_user_id").on(table.userId),
]);

export const taskQueue = sqliteTable("task_queue", {
	taskId: text("task_id").notNull(),
	taskType: text("task_type").notNull(),
	userId: text("user_id").notNull(),
	status: text("status").notNull(),
	priority: integer().notNull(),
	payload: text("payload", { mode: 'json' }).notNull(),
	retryCount: integer("retry_count").notNull(),
	maxRetries: integer("max_retries").notNull(),
	workerId: text("worker_id"),
	errorMessage: text("error_message"),
	startedAt: text("started_at"),
	completedAt: text("completed_at"),
	timeoutSeconds: integer("timeout_seconds").notNull(),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});

export const subscriptionHistory = sqliteTable("subscription_history", {
	id: integer().primaryKey({ autoIncrement: true }),
	subscriptionId: integer("subscription_id").notNull(),
	userId: text("user_id").notNull(),
	eventType: text("event_type").notNull(),
	oldStatus: text("old_status"),
	newStatus: text("new_status"),
	stripeEventId: text("stripe_event_id"),
	stripeEventType: text("stripe_event_type"),
	amount: integer(),
	currency: text("currency"),
	creditsChange: integer("credits_change"),
	metadata: text("metadata", { mode: 'json' }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("ix_subscription_history_created_at").on(table.createdAt),
	index("ix_subscription_history_event_type").on(table.eventType),
	index("ix_subscription_history_subscription_id").on(table.subscriptionId),
	index("ix_subscription_history_user_id").on(table.userId),
	uniqueIndex("subscription_history_stripe_event_id_key").on(table.stripeEventId),
	foreignKey({
		columns: [table.subscriptionId],
		foreignColumns: [userSubscriptions.id],
		name: "subscription_history_subscription_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const users = sqliteTable("users", {
	userId: text("user_id").notNull(),
	email: text("email"),
	name: text("name"),
	photoUrl: text("photo_url"),
	credits: real("credits").notNull(),
	totalCreditsUsed: real("total_credits_used").notNull(),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	phone: text("phone"),
	monthlyCredits: real("monthly_credits").default(0).notNull(),
	monthlyCreditsResetAt: text("monthly_credits_reset_at"),
	authProvider: text("auth_provider"),
	platform: text("platform"),
	usdtBalance: text("usdt_balance").default('0').notNull(),
	ipAddress: text("ip_address"),
}, (table) => [
	index("idx_user_email").on(table.email),
	index("idx_user_id").on(table.userId),
	index("idx_user_platform").on(table.platform),
	uniqueIndex("uq_users_user_id").on(table.userId),
]);

export const ttsRecords = sqliteTable("tts_records", {
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	text: text().notNull(),
	voiceName: text("voice_name").notNull(),
	language: text("language"),
	speed: real("speed").notNull(),
	pitch: integer().notNull(),
	volume: integer().notNull(),
	creditsCost: integer("credits_cost").notNull(),
	characterCount: integer("character_count").notNull(),
	status: text("status").notNull(),
	progress: integer().notNull(),
	audioUrl: text("audio_url"),
	duration: real("duration"),
	format: text("format").notNull(),
	errorMessage: text("error_message"),
	completedAt: text("completed_at"),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	style: text("style"),
	shareId: text("share_id"),
	storyId: text("story_id"),
	platform: text("platform"),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
}, (table) => [
	index("ix_tts_records_is_public").on(table.isPublic),
	index("ix_tts_records_platform").on(table.platform),
	uniqueIndex("ix_tts_records_share_id").on(table.shareId),
	index("ix_tts_records_status").on(table.status),
	index("ix_tts_records_story_id").on(table.storyId),
	uniqueIndex("ix_tts_records_task_id").on(table.taskId),
	index("ix_tts_records_user_created").on(table.userId, table.createdAt),
	index("ix_tts_records_user_id").on(table.userId),
	index("ix_tts_records_user_status").on(table.userId, table.status),
	index("ix_tts_records_user_status_created").on(table.userId, table.status, table.createdAt),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "tts_records_story_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const creditHistory = sqliteTable("credit_history", {
	userId: text("user_id").notNull(),
	amount: real("amount").notNull(),
	taskId: text("task_id"),
	description: text().notNull(),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	productType: text("product_type"),
	adRevenueMicros: integer("ad_revenue_micros"),
	adRevenueCurrency: text("ad_revenue_currency"),
	adRevenueSource: text("ad_revenue_source"),
	randomMultiplier: real("random_multiplier"),
}, (table) => [
	index("idx_credit_history_created_at").on(table.createdAt),
	index("idx_credit_history_product_type").on(table.productType),
	index("idx_credit_history_task_id").on(table.taskId),
	index("idx_credit_history_user_created").on(table.userId, table.createdAt),
	index("idx_credit_history_user_id").on(table.userId),
]);

export const voices = sqliteTable("voices", {
	name: text("name").notNull(),
	provider: text("provider").notNull(),
	locale: text("locale").notNull(),
	country: text("country").notNull(),
	role: text("role").notNull(),
	gender: text("gender").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	voiceSampleUrl: text("voice_sample_url", { mode: 'json' }).notNull(),
	voiceSampleText: text("voice_sample_text").notNull(),
	tags: text("tags", { mode: 'json' }).notNull(),
	styleList: text("style_list", { mode: 'json' }).notNull(),
	isActive: integer("is_active", { mode: 'boolean' }).notNull(),
	sortOrder: integer("sort_order").notNull(),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	displayName: text("display_name"),
}, (table) => [
	index("ix_voices_country").on(table.country),
	index("ix_voices_is_active").on(table.isActive),
	index("ix_voices_locale").on(table.locale),
	index("ix_voices_locale_active").on(table.locale, table.isActive),
	index("ix_voices_name").on(table.name),
	index("ix_voices_provider").on(table.provider),
	index("ix_voices_provider_country").on(table.provider, table.country),
	index("ix_voices_role").on(table.role),
	index("ix_voices_role_country").on(table.role, table.country),
	index("ix_voices_sort_active").on(table.sortOrder, table.isActive),
	uniqueIndex("uq_voices_name").on(table.name),
]);

export const userSubscriptions = sqliteTable("user_subscriptions", {
	userId: text("user_id").notNull(),
	productId: text("product_id").notNull(),
	productType: text("product_type"),
	platform: text("platform"),
	externalTransactionId: text("external_transaction_id").notNull(),
	externalSubscriptionId: text("external_subscription_id"),
	requestId: text("request_id").notNull(),
	status: text("status").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	creditsAllocated: integer("credits_allocated").notNull(),
	amount: integer(),
	currency: text("currency"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()).notNull(),
	activatedAt: text("activated_at"),
	cancelledAt: text("cancelled_at"),
	cancellationReason: text("cancellation_reason"),
	autoRenew: integer("auto_renew", { mode: 'boolean' }).notNull(),
	cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: 'boolean' }).notNull(),
	id: integer().primaryKey({ autoIncrement: true }),
}, (table) => [
	index("ix_user_subscriptions_end_date").on(table.endDate),
	index("ix_user_subscriptions_platform_ext_sub").on(table.platform, table.externalSubscriptionId),
	index("ix_user_subscriptions_platform_ext_txn").on(table.platform, table.externalTransactionId),
	index("ix_user_subscriptions_product_id").on(table.productId),
	uniqueIndex("ix_user_subscriptions_request_id").on(table.requestId),
	index("ix_user_subscriptions_status").on(table.status),
	index("ix_user_subscriptions_status_end_date").on(table.status, table.endDate),
	index("ix_user_subscriptions_user_id").on(table.userId),
	index("ix_user_subscriptions_user_status").on(table.userId, table.status),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.userId],
		name: "fk_user_subscriptions_user_id_users"
	}).onDelete("cascade"),
]);

export const appReleases = sqliteTable("app_releases", {
	id: integer().primaryKey({ autoIncrement: true }),
	platform: text("platform").notNull(),
	version: text("version").notNull(),
	versionCode: integer("version_code").notNull(),
	downloadUrl: text("download_url").notNull(),
	fileSize: integer("file_size"),
	releaseNotes: text("release_notes"),
	isLatest: integer("is_latest", { mode: 'boolean' }).default(false).notNull(),
	isForceUpdate: integer("is_force_update", { mode: 'boolean' }).default(false).notNull(),
	isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
	downloadCount: integer("download_count").default(0).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("app_releases_platform_version_key").on(table.platform, table.version),
	index("ix_app_releases_platform_active").on(table.platform, table.isActive),
	index("ix_app_releases_platform_latest").on(table.platform, table.isLatest),
	index("ix_app_releases_platform_version_code").on(table.platform, table.versionCode),
]);

export const userEvents = sqliteTable("user_events", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	event: text("event").notNull(),
	data: text("data", { mode: 'json' }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("ix_user_events_created_at").on(table.createdAt),
	index("ix_user_events_event").on(table.event),
	index("ix_user_events_user_event").on(table.userId, table.event),
	index("ix_user_events_user_id").on(table.userId),
]);

export const dailyTasks = sqliteTable("daily_tasks", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	date: text("date").notNull(),
	checkinDone: integer("checkin_done", { mode: 'boolean' }).default(false).notNull(),
	checkinCredits: integer("checkin_credits").default(0).notNull(),
	adRewardsClaimed: integer("ad_rewards_claimed").default(0).notNull(),
	adRewardsCredits: real("ad_rewards_credits").default(0).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_daily_tasks_date").on(table.date),
	index("ix_daily_tasks_user_id").on(table.userId),
	uniqueIndex("uq_daily_tasks_user_date").on(table.userId, table.date),
]);

export const adRewardTransactions = sqliteTable("ad_reward_transactions", {
	id: integer().primaryKey({ autoIncrement: true }),
	transactionId: text("transaction_id").notNull(),
	userId: text("user_id").notNull(),
	tier: integer(),
	timestamp: text("timestamp").notNull(),
	adUnit: text("ad_unit"),
	rewardAmount: real("reward_amount").default(0).notNull(),
	processed: integer("processed", { mode: 'boolean' }).default(false).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	uniqueIndex("ad_reward_transactions_transaction_id_key").on(table.transactionId),
	index("ix_ad_reward_transactions_processed").on(table.processed),
	index("ix_ad_reward_transactions_timestamp").on(table.timestamp),
	index("ix_ad_reward_transactions_user_id").on(table.userId),
]);

export const stories = sqliteTable("stories", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	content: text().notNull(),
	keywords: text("keywords"),
	ideaTitle: text("idea_title"),
	ideaDescription: text("idea_description"),
	locale: text("locale").default('en-US').notNull(),
	wordCount: integer("word_count").default(0).notNull(),
	status: text("status").default('draft').notNull(),
	videoUrl: text("video_url"),
	videoStatus: text("video_status").default('none').notNull(),
	videoDuration: integer("video_duration"),
	videoThumbnail: text("video_thumbnail"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	characterDescriptions: text("character_descriptions"),
}, (table) => [
	index("ix_stories_created_at").on(table.createdAt),
	index("ix_stories_status").on(table.status),
	index("ix_stories_user_created").on(table.userId, table.createdAt),
	index("ix_stories_user_id").on(table.userId),
	index("ix_stories_user_status").on(table.userId, table.status),
]);

export const rvcVoiceModels = sqliteTable("rvc_voice_models", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	category: text("category").notNull(),
	avatarUrl: text("avatar_url"),
	sampleUrl: text("sample_url"),
	modelUrl: text("model_url").notNull(),
	indexUrl: text("index_url"),
	usesCount: integer("uses_count").default(0).notNull(),
	isBuiltin: integer("is_builtin", { mode: 'boolean' }).default(false).notNull(),
	builtinName: text("builtin_name"),
	isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_rvc_voice_models_category").on(table.category),
	index("ix_rvc_voice_models_is_active").on(table.isActive),
	index("ix_rvc_voice_models_is_builtin").on(table.isBuiltin),
	index("ix_rvc_voice_models_sort_order").on(table.sortOrder),
	uniqueIndex("rvc_voice_models_slug_key").on(table.slug),
]);

export const storyIllustrations = sqliteTable("story_illustrations", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	imageUrl: text("image_url"),
	prompt: text(),
	position: integer().default(0).notNull(),
	paragraph: integer(),
	status: text("status").default('pending').notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	creditsCost: integer("credits_cost").default(0).notNull(),
	errorMessage: text("error_message"),
	height: integer().default(1024).notNull(),
	model: text("model"),
	sceneDescription: text("scene_description"),
	taskId: text("task_id"),
	type: text("type").default('scene').notNull(),
	width: integer().default(1024).notNull(),
}, (table) => [
	index("ix_story_illustrations_position").on(table.position),
	index("ix_story_illustrations_status").on(table.status),
	index("ix_story_illustrations_story_id").on(table.storyId),
	index("ix_story_illustrations_type").on(table.type),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "story_illustrations_story_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const storyParagraphs = sqliteTable("story_paragraphs", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	position: integer().default(0).notNull(),
	content: text().notNull(),
	audioUrl: text("audio_url"),
	audioDuration: real("audio_duration"),
	audioVoice: text("audio_voice"),
	audioStatus: text("audio_status").default('none').notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	illustrationPrompt: text("illustration_prompt"),
	illustrationStatus: text("illustration_status").default('none').notNull(),
	illustrationUrl: text("illustration_url"),
}, (table) => [
	index("ix_story_paragraphs_position").on(table.position),
	index("ix_story_paragraphs_story_id").on(table.storyId),
	uniqueIndex("uq_story_paragraphs_story_position").on(table.storyId, table.position),
	foreignKey({
		columns: [table.storyId],
		foreignColumns: [stories.id],
		name: "story_paragraphs_story_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const coverRecords = sqliteTable("cover_records", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	originalAudioUrl: text("original_audio_url").notNull(),
	voiceModelId: integer("voice_model_id").notNull(),
	voiceModelName: text("voice_model_name").notNull(),
	pitchChange: integer("pitch_change").default(0).notNull(),
	f0Method: text("f0_method").default('rmvpe').notNull(),
	indexRate: real("index_rate").default(0.5).notNull(),
	protect: real("protect").default(0.33).notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	spleeterTaskId: text("spleeter_task_id"),
	rvcTaskId: text("rvc_task_id"),
	vocalsUrl: text("vocals_url"),
	accompanimentUrl: text("accompaniment_url"),
	convertedVocalsUrl: text("converted_vocals_url"),
	outputUrl: text("output_url"),
	duration: real("duration"),
	creditsCost: integer("credits_cost").notNull(),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
	errorMessage: text("error_message"),
	shareId: text("share_id"),
	completedAt: text("completed_at"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("cover_records_share_id_key").on(table.shareId),
	uniqueIndex("cover_records_task_id_key").on(table.taskId),
	index("ix_cover_records_status").on(table.status),
	index("ix_cover_records_user_created").on(table.userId, table.createdAt),
	index("ix_cover_records_user_id").on(table.userId),
	index("ix_cover_records_user_status").on(table.userId, table.status),
	index("ix_cover_records_voice_model_id").on(table.voiceModelId),
]);

export const shareLinks = sqliteTable("share_links", {
	id: integer().primaryKey({ autoIncrement: true }),
	token: text("token").notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: text("resource_id").notNull(),
	userId: text("user_id").notNull(),
	expiresAt: text("expires_at").notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("ix_share_links_expires_at").on(table.expiresAt),
	index("ix_share_links_resource").on(table.resourceType, table.resourceId),
	index("ix_share_links_token").on(table.token),
	index("ix_share_links_user_id").on(table.userId),
	uniqueIndex("share_links_token_key").on(table.token),
]);

export const videoRecords = sqliteTable("video_records", {
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	taskType: text("task_type").notNull(),
	model: text("model").notNull(),
	prompt: text().notNull(),
	promptZh: text("prompt_zh"),
	negativePrompt: text("negative_prompt"),
	resolution: text("resolution").notNull(),
	duration: integer().notNull(),
	aspectRatio: text("aspect_ratio").notNull(),
	seed: integer(),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	videoUrl: text("video_url"),
	thumbnailUrl: text("thumbnail_url"),
	actualDuration: real("actual_duration"),
	format: text("format").default('mp4').notNull(),
	errorMessage: text("error_message"),
	completedAt: text("completed_at"),
	shareId: text("share_id"),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	apiCost: real("api_cost"),
	viewCount: integer("view_count").default(0).notNull(),
	externalTaskId: text("external_task_id"),
}, (table) => [
	index("ix_video_records_external_task_id").on(table.externalTaskId),
	index("ix_video_records_is_public").on(table.isPublic),
	uniqueIndex("ix_video_records_share_id").on(table.shareId),
	index("ix_video_records_status").on(table.status),
	uniqueIndex("ix_video_records_task_id").on(table.taskId),
	index("ix_video_records_user_created").on(table.userId, table.createdAt),
	index("ix_video_records_user_id").on(table.userId),
	index("ix_video_records_user_status").on(table.userId, table.status),
	index("ix_video_records_user_status_created").on(table.userId, table.status, table.createdAt),
]);

export const imageRecords = sqliteTable("image_records", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	model: text("model").notNull(),
	prompt: text().notNull(),
	aspectRatio: text("aspect_ratio").notNull(),
	quality: text("quality").notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	imageUrl: text("image_url"),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
	creditsUsed: integer("credits_used").notNull(),
	error: text(),
	completedAt: text("completed_at"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	uniqueIndex("image_records_task_id_key").on(table.taskId),
	index("ix_image_records_is_public").on(table.isPublic),
	index("ix_image_records_status").on(table.status),
	index("ix_image_records_user_created").on(table.userId, table.createdAt),
	index("ix_image_records_user_id").on(table.userId),
	index("ix_image_records_user_status").on(table.userId, table.status),
]);

export const musicRecords = sqliteTable("music_records", {
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	externalTaskId: text("external_task_id"),
	model: text("model").notNull(),
	prompt: text().notNull(),
	style: text("style"),
	title: text("title"),
	lyrics: text(),
	isInstrumental: integer("is_instrumental", { mode: 'boolean' }).default(false).notNull(),
	isCustomMode: integer("is_custom_mode", { mode: 'boolean' }).default(false).notNull(),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	audioUrl: text("audio_url"),
	audioUrl2: text("audio_url_2"),
	streamUrl: text("stream_url"),
	streamUrl2: text("stream_url_2"),
	coverUrl: text("cover_url"),
	coverUrl2: text("cover_url_2"),
	duration: real("duration"),
	duration2: real("duration_2"),
	tags: text("tags"),
	errorMessage: text("error_message"),
	completedAt: text("completed_at"),
	shareId: text("share_id"),
	id: integer().primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	externalTrackId: text("external_track_id"),
	externalTrackId2: text("external_track_id_2"),
}, (table) => [
	index("ix_music_records_external_task_id").on(table.externalTaskId),
	index("ix_music_records_is_public").on(table.isPublic),
	uniqueIndex("ix_music_records_share_id").on(table.shareId),
	index("ix_music_records_status").on(table.status),
	uniqueIndex("ix_music_records_task_id").on(table.taskId),
	index("ix_music_records_user_created").on(table.userId, table.createdAt),
	index("ix_music_records_user_id").on(table.userId),
	index("ix_music_records_user_status").on(table.userId, table.status),
]);

export const dialogueRecords = sqliteTable("dialogue_records", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	externalTaskId: text("external_task_id"),
	dialogueJson: text("dialogue_json").notNull(),
	totalCharacters: integer("total_characters").notNull(),
	creditsCost: integer("credits_cost").notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	audioUrl: text("audio_url"),
	duration: real("duration"),
	errorMessage: text("error_message"),
	completedAt: text("completed_at"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
	isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
}, (table) => [
	uniqueIndex("dialogue_records_task_id_key").on(table.taskId),
	index("ix_dialogue_records_external_task_id").on(table.externalTaskId),
	index("ix_dialogue_records_is_public").on(table.isPublic),
	index("ix_dialogue_records_status").on(table.status),
	index("ix_dialogue_records_user_created").on(table.userId, table.createdAt),
	index("ix_dialogue_records_user_id").on(table.userId),
]);

export const nativeBanners = sqliteTable("native_banners", {
	id: integer().primaryKey({ autoIncrement: true }),
	imageUrl: text("image_url").notNull(),
	linkUrl: text("link_url"),
	titles: text("titles", { mode: 'json' }).notNull(),
	subtitles: text("subtitles", { mode: 'json' }).notNull(),
	buttonTexts: text("button_texts", { mode: 'json' }),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_native_banners_active_sort").on(table.isActive, table.sortOrder),
]);

export const videoDownloadRecords = sqliteTable("video_download_records", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	url: text().notNull(),
	platform: text("platform"),
	videoTitle: text("video_title"),
	videoAuthor: text("video_author"),
	status: text("status").notNull(),
	errorCode: text("error_code"),
	creditsCost: integer("credits_cost").default(0).notNull(),
	isAnonymous: integer("is_anonymous", { mode: 'boolean' }).default(false).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("ix_video_download_records_created_at").on(table.createdAt),
	index("ix_video_download_records_platform").on(table.platform),
	index("ix_video_download_records_status").on(table.status),
	index("ix_video_download_records_user_id").on(table.userId),
]);

export const imageToolRecords = sqliteTable("image_tool_records", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	toolType: text("tool_type").notNull(),
	status: text("status").notNull(),
	progress: integer().default(0).notNull(),
	originalImageUrl: text("original_image_url").notNull(),
	resultImageUrl: text("result_image_url"),
	creditsUsed: integer("credits_used").notNull(),
	error: text(),
	completedAt: text("completed_at"),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	uniqueIndex("image_tool_records_task_id_key").on(table.taskId),
	index("ix_image_tool_records_user_id").on(table.userId),
]);

export const clonedVoices = sqliteTable("cloned_voices", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	fishModelId: text("fish_model_id").notNull(),
	description: text(),
	coverImageUrl: text("cover_image_url"),
	sampleAudioUrl: text("sample_audio_url"),
	referenceText: text("reference_text"),
	status: text("status").default('TRAINING').notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
}, (table) => [
	index("ix_cloned_voices_user_id").on(table.userId),
	index("ix_cloned_voices_status").on(table.status),
	uniqueIndex("ix_cloned_voices_fish_model_id").on(table.fishModelId),
]);

export const conversions = sqliteTable("conversions", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	type: text("type").notNull(),
	voicicaAmount: integer("voicica_amount").notNull(),
	usdtAmount: text("usdt_amount").notNull(),
	rate: text("rate").notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("idx_conversions_user_id").on(table.userId),
]);


// ============================================================
// ============================================================
// Device Tokens (FCM Push Notifications)
// ============================================================

export const deviceTokens = sqliteTable("device_tokens", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	token: text("token").notNull(),
	platform: text("platform").notNull(), // 'android' | 'ios' | 'web'
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("idx_device_tokens_user_id").on(table.userId),
	uniqueIndex("uq_device_tokens_token").on(table.token),
]);

export const pushNotificationLogs = sqliteTable("push_notification_logs", {
	id: integer().primaryKey({ autoIncrement: true }),
	target: text("target").notNull(), // 'all' | 'user'
	targetUserId: text("target_user_id"), // 指定用户时的 userId
	title: text("title").notNull(),
	body: text("body").notNull(),
	sentBy: text("sent_by").notNull(), // 发送者（admin email）
	totalDevices: integer("total_devices").default(0).notNull(),
	sentCount: integer("sent_count").default(0).notNull(),
	failedCount: integer("failed_count").default(0).notNull(),
	createdAt: text("created_at").default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).notNull(),
}, (table) => [
	index("idx_push_logs_created_at").on(table.createdAt),
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

// ============================================================
// System Configs
// ============================================================

export const systemConfigs = sqliteTable("system_configs", {
	key: text("key").primaryKey(),
	value: text("value").notNull(), // prod JSON string
	devValue: text("dev_value"),    // dev JSON string (null = same as prod)
	description: text("description"),
	updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});
