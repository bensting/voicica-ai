/**
 * Drizzle ORM Schema for D1 (SQLite)
 */
import { sqliteTable, text, integer, real, unique, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ==================== 应用业务表 ====================

export const anonymousUsers = sqliteTable('anonymous_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  deviceFingerprint: text('device_fingerprint').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  credits: integer('credits').notNull(),
  totalCreditsUsed: integer('total_credits_used').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull(),
  convertedToUserId: text('converted_to_user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_anonymous_users_user_id').on(table.userId),
  index('idx_anonymous_users_device_fingerprint').on(table.deviceFingerprint),
  index('idx_anonymous_users_expires_at').on(table.expiresAt),
  index('idx_anonymous_users_last_used_at').on(table.lastUsedAt),
  index('idx_anonymous_users_converted_to_user_id').on(table.convertedToUserId),
]);

export const configs = sqliteTable('configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value', { mode: 'json' }).notNull(),
  description: text('description'),
  configType: text('config_type'),
  version: integer('version').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('ix_configs_config_type').on(table.configType),
  index('ix_configs_is_active').on(table.isActive),
]);

export const creditHistory = sqliteTable('credit_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  amount: integer('amount').notNull(),
  taskId: text('task_id'),
  description: text('description').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_credit_history_user_id').on(table.userId),
  index('idx_credit_history_task_id').on(table.taskId),
  index('idx_credit_history_created_at').on(table.createdAt),
  index('idx_credit_history_user_created').on(table.userId, table.createdAt),
]);

export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  productType: text('product_type').notNull(),
  productId: text('product_id').notNull(),
  basePlanId: text('base_plan_id'),
  planName: text('plan_name').notNull(),
  displayName: text('display_name', { mode: 'json' }).notNull(),
  features: text('features', { mode: 'json' }).notNull(),
  creditsPerCycle: integer('credits_per_cycle').notNull(),
  cycleDays: integer('cycle_days').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull(),
  sortOrder: integer('sort_order').notNull(),
  price: text('price', { mode: 'json' }).notNull(),
  discountedPrice: text('discounted_price', { mode: 'json' }).notNull(),
  billingPeriod: text('billing_period').notNull(),
  enableFirstMonthCoupon: integer('enable_first_month_coupon', { mode: 'boolean' }).notNull(),
  firstMonthCouponId: text('first_month_coupon_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('ix_subscription_plans_platform').on(table.platform),
  index('ix_subscription_plans_product_id').on(table.productId),
  index('ix_subscription_plans_active').on(table.active),
]);

export const taskQueue = sqliteTable('task_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: text('task_id').notNull(),
  taskType: text('task_type').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').notNull(),
  priority: integer('priority').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  retryCount: integer('retry_count').notNull(),
  maxRetries: integer('max_retries').notNull(),
  workerId: text('worker_id'),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  timeoutSeconds: integer('timeout_seconds').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const ttsRecords = sqliteTable('tts_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  taskId: text('task_id').notNull().unique(),
  text: text('text').notNull(),
  voiceName: text('voice_name').notNull(),
  language: text('language'),
  speed: real('speed').notNull(),
  pitch: integer('pitch').notNull(),
  volume: integer('volume').notNull(),
  creditsCost: integer('credits_cost').notNull(),
  characterCount: integer('character_count').notNull(),
  status: text('status').notNull(),
  progress: integer('progress').notNull(),
  audioUrl: text('audio_url'),
  duration: real('duration'),
  format: text('format').notNull(),
  errorMessage: text('error_message'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('ix_tts_records_user_id').on(table.userId),
  index('ix_tts_records_status').on(table.status),
  index('ix_tts_records_user_created').on(table.userId, table.createdAt),
  index('ix_tts_records_user_status').on(table.userId, table.status),
  index('ix_tts_records_user_status_created').on(table.userId, table.status, table.createdAt),
]);

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  email: text('email'),
  name: text('name'),
  photoUrl: text('photo_url'),
  credits: integer('credits').notNull(),
  totalCreditsUsed: integer('total_credits_used').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_user_id').on(table.userId),
  index('idx_user_email').on(table.email),
]);

export const userSubscriptions = sqliteTable('user_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  subscriptionPlanId: integer('subscription_plan_id').notNull().references(() => subscriptionPlans.id),
  productId: text('product_id').notNull(),
  productType: text('product_type'),
  platform: text('platform'),
  externalTransactionId: text('external_transaction_id').notNull(),
  externalSubscriptionId: text('external_subscription_id'),
  requestId: text('request_id').notNull().unique(),
  status: text('status').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  creditsAllocated: integer('credits_allocated').notNull(),
  amount: integer('amount'),
  currency: text('currency'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  cancellationReason: text('cancellation_reason'),
  autoRenew: integer('auto_renew', { mode: 'boolean' }).notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull(),
}, (table) => [
  index('ix_user_subscriptions_user_id').on(table.userId),
  index('ix_user_subscriptions_status').on(table.status),
  index('ix_user_subscriptions_end_date').on(table.endDate),
  index('ix_user_subscriptions_user_status').on(table.userId, table.status),
  index('ix_user_subscriptions_status_end_date').on(table.status, table.endDate),
  index('ix_user_subscriptions_platform_ext_sub').on(table.platform, table.externalSubscriptionId),
  index('ix_user_subscriptions_platform_ext_txn').on(table.platform, table.externalTransactionId),
]);

export const subscriptionHistory = sqliteTable('subscription_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id').notNull().references(() => userSubscriptions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  eventType: text('event_type').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  stripeEventId: text('stripe_event_id').unique(),
  stripeEventType: text('stripe_event_type'),
  amount: integer('amount'),
  currency: text('currency'),
  creditsChange: integer('credits_change'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('ix_subscription_history_subscription_id').on(table.subscriptionId),
  index('ix_subscription_history_user_id').on(table.userId),
  index('ix_subscription_history_event_type').on(table.eventType),
  index('ix_subscription_history_created_at').on(table.createdAt),
]);

export const voices = sqliteTable('voices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  displayName: text('display_name'),
  provider: text('provider').notNull(),
  locale: text('locale').notNull(),
  country: text('country').notNull(),
  role: text('role').notNull(),
  gender: text('gender').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  voiceSampleUrl: text('voice_sample_url').notNull(),
  voiceSampleText: text('voice_sample_text').notNull(),
  tags: text('tags', { mode: 'json' }).notNull(),
  styleList: text('style_list', { mode: 'json' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('ix_voices_name').on(table.name),
  index('ix_voices_provider').on(table.provider),
  index('ix_voices_locale').on(table.locale),
  index('ix_voices_country').on(table.country),
  index('ix_voices_role').on(table.role),
  index('ix_voices_is_active').on(table.isActive),
  index('ix_voices_locale_active').on(table.locale, table.isActive),
  index('ix_voices_provider_country').on(table.provider, table.country),
  index('ix_voices_role_country').on(table.role, table.country),
  index('ix_voices_sort_active').on(table.sortOrder, table.isActive),
]);

// ==================== Auth.js 表 ====================

export const authUsers = sqliteTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  appUserId: text('app_user_id').unique(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => [
  unique('provider_account_unique').on(table.provider, table.providerAccountId),
]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
}, (table) => [
  unique('identifier_token_unique').on(table.identifier, table.token),
]);

// ==================== Relations ====================

export const usersRelations = relations(users, ({ many, one }) => ({
  subscriptions: many(userSubscriptions),
  authUser: one(authUsers, {
    fields: [users.userId],
    references: [authUsers.appUserId],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.userId],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.subscriptionPlanId],
    references: [subscriptionPlans.id],
  }),
  history: many(subscriptionHistory),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  subscription: one(userSubscriptions, {
    fields: [subscriptionHistory.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

export const authUsersRelations = relations(authUsers, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  appUser: one(users, {
    fields: [authUsers.appUserId],
    references: [users.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(authUsers, {
    fields: [accounts.userId],
    references: [authUsers.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(authUsers, {
    fields: [sessions.userId],
    references: [authUsers.id],
  }),
}));