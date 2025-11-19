/**
 * Sync database schema - Create all tables
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// SQL statements to create all tables
const CREATE_TABLE_STATEMENTS: Record<string, string> = {
  anonymous_users: `
    CREATE TABLE IF NOT EXISTS anonymous_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      device_fingerprint TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      credits INTEGER NOT NULL,
      total_credits_used INTEGER NOT NULL,
      expires_at INTEGER,
      last_used_at INTEGER,
      is_anonymous INTEGER NOT NULL,
      converted_to_user_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  configs: `
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      config_type TEXT,
      version INTEGER NOT NULL,
      is_active INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  credit_history: `
    CREATE TABLE IF NOT EXISTS credit_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      task_id TEXT,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  subscription_plans: `
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      product_type TEXT NOT NULL,
      product_id TEXT NOT NULL,
      base_plan_id TEXT,
      plan_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      features TEXT NOT NULL,
      credits_per_cycle INTEGER NOT NULL,
      cycle_days INTEGER NOT NULL,
      active INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      price TEXT NOT NULL,
      discounted_price TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      enable_first_month_coupon INTEGER NOT NULL,
      first_month_coupon_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `,
  task_queue: `
    CREATE TABLE IF NOT EXISTS task_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      priority INTEGER NOT NULL,
      payload TEXT NOT NULL,
      retry_count INTEGER NOT NULL,
      max_retries INTEGER NOT NULL,
      worker_id TEXT,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      timeout_seconds INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  tts_records: `
    CREATE TABLE IF NOT EXISTS tts_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL UNIQUE,
      text TEXT NOT NULL,
      voice_name TEXT NOT NULL,
      language TEXT,
      speed REAL NOT NULL,
      pitch INTEGER NOT NULL,
      volume INTEGER NOT NULL,
      credits_cost INTEGER NOT NULL,
      character_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL,
      audio_url TEXT,
      duration REAL,
      format TEXT NOT NULL,
      error_message TEXT,
      completed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      email TEXT,
      name TEXT,
      photo_url TEXT,
      credits INTEGER NOT NULL,
      total_credits_used INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  user_subscriptions: `
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
      product_id TEXT NOT NULL,
      product_type TEXT,
      platform TEXT,
      external_transaction_id TEXT NOT NULL,
      external_subscription_id TEXT,
      request_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      credits_allocated INTEGER NOT NULL,
      amount INTEGER,
      currency TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      activated_at INTEGER,
      cancelled_at INTEGER,
      cancellation_reason TEXT,
      auto_renew INTEGER NOT NULL,
      cancel_at_period_end INTEGER NOT NULL
    )
  `,
  subscription_history: `
    CREATE TABLE IF NOT EXISTS subscription_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      stripe_event_id TEXT UNIQUE,
      stripe_event_type TEXT,
      amount INTEGER,
      currency TEXT,
      credits_change INTEGER,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `,
  voices: `
    CREATE TABLE IF NOT EXISTS voices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      provider TEXT NOT NULL,
      locale TEXT NOT NULL,
      country TEXT NOT NULL,
      role TEXT NOT NULL,
      gender TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      voice_sample_url TEXT NOT NULL,
      voice_sample_text TEXT NOT NULL,
      tags TEXT NOT NULL,
      style_list TEXT NOT NULL,
      is_active INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `,
  auth_users: `
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      email_verified INTEGER,
      image TEXT,
      app_user_id TEXT UNIQUE
    )
  `,
  accounts: `
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, provider_account_id)
    )
  `,
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    )
  `,
  verification_tokens: `
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires INTEGER NOT NULL,
      UNIQUE(identifier, token)
    )
  `,
};

// Indexes to create
const CREATE_INDEX_STATEMENTS = [
  // anonymous_users indexes
  'CREATE INDEX IF NOT EXISTS idx_anonymous_users_user_id ON anonymous_users(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_anonymous_users_device_fingerprint ON anonymous_users(device_fingerprint)',
  'CREATE INDEX IF NOT EXISTS idx_anonymous_users_expires_at ON anonymous_users(expires_at)',
  'CREATE INDEX IF NOT EXISTS idx_anonymous_users_last_used_at ON anonymous_users(last_used_at)',
  'CREATE INDEX IF NOT EXISTS idx_anonymous_users_converted_to_user_id ON anonymous_users(converted_to_user_id)',

  // configs indexes
  'CREATE INDEX IF NOT EXISTS ix_configs_config_type ON configs(config_type)',
  'CREATE INDEX IF NOT EXISTS ix_configs_is_active ON configs(is_active)',

  // credit_history indexes
  'CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_credit_history_task_id ON credit_history(task_id)',
  'CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_credit_history_user_created ON credit_history(user_id, created_at)',

  // subscription_plans indexes
  'CREATE INDEX IF NOT EXISTS ix_subscription_plans_platform ON subscription_plans(platform)',
  'CREATE INDEX IF NOT EXISTS ix_subscription_plans_product_id ON subscription_plans(product_id)',
  'CREATE INDEX IF NOT EXISTS ix_subscription_plans_active ON subscription_plans(active)',

  // tts_records indexes
  'CREATE INDEX IF NOT EXISTS ix_tts_records_user_id ON tts_records(user_id)',
  'CREATE INDEX IF NOT EXISTS ix_tts_records_status ON tts_records(status)',
  'CREATE INDEX IF NOT EXISTS ix_tts_records_user_created ON tts_records(user_id, created_at)',
  'CREATE INDEX IF NOT EXISTS ix_tts_records_user_status ON tts_records(user_id, status)',
  'CREATE INDEX IF NOT EXISTS ix_tts_records_user_status_created ON tts_records(user_id, status, created_at)',

  // users indexes
  'CREATE INDEX IF NOT EXISTS idx_user_id ON users(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)',

  // user_subscriptions indexes
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_user_id ON user_subscriptions(user_id)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_status ON user_subscriptions(status)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_end_date ON user_subscriptions(end_date)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_user_status ON user_subscriptions(user_id, status)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_status_end_date ON user_subscriptions(status, end_date)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_platform_ext_sub ON user_subscriptions(platform, external_subscription_id)',
  'CREATE INDEX IF NOT EXISTS ix_user_subscriptions_platform_ext_txn ON user_subscriptions(platform, external_transaction_id)',

  // subscription_history indexes
  'CREATE INDEX IF NOT EXISTS ix_subscription_history_subscription_id ON subscription_history(subscription_id)',
  'CREATE INDEX IF NOT EXISTS ix_subscription_history_user_id ON subscription_history(user_id)',
  'CREATE INDEX IF NOT EXISTS ix_subscription_history_event_type ON subscription_history(event_type)',
  'CREATE INDEX IF NOT EXISTS ix_subscription_history_created_at ON subscription_history(created_at)',

  // voices indexes
  'CREATE INDEX IF NOT EXISTS ix_voices_name ON voices(name)',
  'CREATE INDEX IF NOT EXISTS ix_voices_provider ON voices(provider)',
  'CREATE INDEX IF NOT EXISTS ix_voices_locale ON voices(locale)',
  'CREATE INDEX IF NOT EXISTS ix_voices_country ON voices(country)',
  'CREATE INDEX IF NOT EXISTS ix_voices_role ON voices(role)',
  'CREATE INDEX IF NOT EXISTS ix_voices_is_active ON voices(is_active)',
  'CREATE INDEX IF NOT EXISTS ix_voices_locale_active ON voices(locale, is_active)',
  'CREATE INDEX IF NOT EXISTS ix_voices_provider_country ON voices(provider, country)',
  'CREATE INDEX IF NOT EXISTS ix_voices_role_country ON voices(role, country)',
  'CREATE INDEX IF NOT EXISTS ix_voices_sort_active ON voices(sort_order, is_active)',
];

export async function POST() {
  try {
    const db = await getDb();
    const results: string[] = [];
    const errors: string[] = [];

    // Create tables in order (respecting foreign keys)
    const tableOrder = [
      'auth_users',
      'users',
      'anonymous_users',
      'configs',
      'subscription_plans',
      'voices',
      'credit_history',
      'task_queue',
      'tts_records',
      'user_subscriptions',
      'subscription_history',
      'accounts',
      'sessions',
      'verification_tokens',
    ];

    for (const tableName of tableOrder) {
      const sql = CREATE_TABLE_STATEMENTS[tableName];
      if (sql) {
        try {
          await db.run(sql);
          results.push(`Created table: ${tableName}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to create ${tableName}: ${errorMsg}`);
        }
      }
    }

    // Create indexes
    for (const indexSql of CREATE_INDEX_STATEMENTS) {
      try {
        await db.run(indexSql);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Index error: ${errorMsg}`);
      }
    }

    results.push(`Created ${CREATE_INDEX_STATEMENTS.length} indexes`);

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Completed with errors: ${results.join(', ')}`,
        errors,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${tableOrder.length} tables and indexes`,
      results,
    });
  } catch (error) {
    console.error('Database sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}