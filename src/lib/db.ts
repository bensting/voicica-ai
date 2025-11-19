/**
 * Database helper for Cloudflare D1
 */
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export type DbClient = ReturnType<typeof getDb>;

/**
 * Get database client from Cloudflare context
 * Use this in API routes and server actions
 */
export function getDb() {
  const { env } = getRequestContext();
  return drizzle(env.DB, { schema });
}

/**
 * Get database client with custom D1 instance
 * Use this when you have direct access to D1 binding
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// Re-export schema
export * from '@/db/schema';