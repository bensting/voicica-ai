/**
 * Get database tables status
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Tables defined in schema
const SCHEMA_TABLES = [
  'anonymous_users',
  'configs',
  'credit_history',
  'subscription_plans',
  'task_queue',
  'tts_records',
  'users',
  'user_subscriptions',
  'subscription_history',
  'voices',
  'auth_users',
  'accounts',
  'sessions',
  'verification_tokens',
];

export async function GET() {
  try {
    const db = await getDb();

    // Get existing tables from D1
    const result = await db.run(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`
    ) as { results: Array<{ name: string }> };

    const existingTables = new Set(result.results.map((row) => row.name));

    // Check each schema table
    const tables = await Promise.all(
      SCHEMA_TABLES.map(async (tableName) => {
        const exists = existingTables.has(tableName);
        let rowCount: number | undefined;

        if (exists) {
          try {
            const countResult = await db.run(
              `SELECT COUNT(*) as count FROM "${tableName}"`
            ) as { results: Array<{ count: number }> };
            rowCount = countResult.results[0]?.count ?? 0;
          } catch {
            rowCount = undefined;
          }
        }

        return {
          name: tableName,
          exists,
          rowCount,
        };
      })
    );

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { tables: [], error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}