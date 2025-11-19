/**
 * Create a single table
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Import from sync route would cause circular dependency, so we duplicate the essential ones
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

export async function POST(request: NextRequest) {
  try {
    const { tableName } = await request.json() as { tableName: string };

    if (!tableName || !CREATE_TABLE_STATEMENTS[tableName]) {
      return NextResponse.json(
        { success: false, error: `Invalid table name: ${tableName}` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const sql = CREATE_TABLE_STATEMENTS[tableName];

    await db.run(sql);

    return NextResponse.json({
      success: true,
      message: `Table "${tableName}" created successfully`,
    });
  } catch (error) {
    console.error('Create table error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}