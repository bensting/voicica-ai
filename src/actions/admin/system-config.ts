'use server';

import { getDb } from '@/lib/db';
import { systemConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface FeatureFlags {
  voice: boolean;
  dialogue: boolean;
  clone: boolean;
  music: boolean;
  image: boolean;
  'image-tools': boolean;
  video: boolean;
  'video-downloader': boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voice: true,
  dialogue: true,
  clone: true,
  music: true,
  image: true,
  'image-tools': true,
  video: true,
  'video-downloader': true,
};

/** 读取当前环境的 feature flags（dev 读 dev_value，prod 读 value） */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const db = await getDb();
    const row = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'feature_flags')).get();
    if (!row) return DEFAULT_FEATURE_FLAGS;
    const isDev = process.env.NODE_ENV === 'development';
    const json = isDev && row.devValue ? row.devValue : row.value;
    return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

/** 读取 prod + dev 两套 flags（admin 页面用） */
export async function getAllFeatureFlags(): Promise<{ prod: FeatureFlags; dev: FeatureFlags }> {
  try {
    const db = await getDb();
    const row = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'feature_flags')).get();
    if (!row) return { prod: DEFAULT_FEATURE_FLAGS, dev: DEFAULT_FEATURE_FLAGS };
    const prod = { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(row.value) };
    const dev = { ...DEFAULT_FEATURE_FLAGS, ...(row.devValue ? JSON.parse(row.devValue) : {}) };
    return { prod, dev };
  } catch {
    return { prod: DEFAULT_FEATURE_FLAGS, dev: DEFAULT_FEATURE_FLAGS };
  }
}

/** 更新指定环境的 feature flags */
export async function updateFeatureFlags(flags: FeatureFlags, scope: 'prod' | 'dev') {
  const db = await getDb();
  if (scope === 'prod') {
    await db.insert(systemConfigs)
      .values({ key: 'feature_flags', value: JSON.stringify(flags), description: '功能入口显示控制' })
      .onConflictDoUpdate({
        target: systemConfigs.key,
        set: { value: JSON.stringify(flags), updatedAt: new Date().toISOString() },
      });
  } else {
    await db.insert(systemConfigs)
      .values({ key: 'feature_flags', value: JSON.stringify(DEFAULT_FEATURE_FLAGS), devValue: JSON.stringify(flags), description: '功能入口显示控制' })
      .onConflictDoUpdate({
        target: systemConfigs.key,
        set: { devValue: JSON.stringify(flags), updatedAt: new Date().toISOString() },
      });
  }
  return { success: true };
}

export async function getAllSystemConfigs() {
  const db = await getDb();
  return db.select().from(systemConfigs).all();
}

export async function updateSystemConfig(key: string, value: unknown, description?: string) {
  const db = await getDb();
  await db.insert(systemConfigs)
    .values({ key, value: JSON.stringify(value), description })
    .onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value: JSON.stringify(value), updatedAt: new Date().toISOString() },
    });
  return { success: true };
}
