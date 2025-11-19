'use server';

/**
 * 语音模块 Server Actions
 *
 * 使用服务端缓存优化查询性能
 */
import { getDb } from '@/lib/db';
import { voices as voicesTable } from '@/db/schema';
import { eq, asc, desc, max } from 'drizzle-orm';
import type { Voice, VoiceListResponse, VoiceFilters } from '@/types/voice';

// Drizzle 查询结果类型
type VoiceRecord = typeof voicesTable.$inferSelect;

// ==================== 缓存层 ====================

interface VoiceCache {
  voices: VoiceRecord[];
  lastUpdatedAt: Date | null;
}

// 模块级缓存
let voiceCache: VoiceCache = {
  voices: [],
  lastUpdatedAt: null,
};

/**
 * 获取数据库中最新的 updated_at 时间戳
 */
async function getLatestUpdatedAt(): Promise<Date | null> {
  const db = await getDb();
  const result = await db
    .select({ maxUpdatedAt: max(voicesTable.updatedAt) })
    .from(voicesTable)
    .where(eq(voicesTable.isActive, true));

  return result[0]?.maxUpdatedAt || null;
}

/**
 * 检查缓存是否有效
 */
async function isCacheValid(): Promise<boolean> {
  if (voiceCache.voices.length === 0 || !voiceCache.lastUpdatedAt) {
    return false;
  }

  const latestUpdatedAt = await getLatestUpdatedAt();
  if (!latestUpdatedAt) {
    return false;
  }

  // 比较时间戳
  return voiceCache.lastUpdatedAt.getTime() === latestUpdatedAt.getTime();
}

/**
 * 加载所有活跃语音到缓存
 */
async function loadVoicesIntoCache(): Promise<void> {
  console.log('🔄 [VoiceCache] 重新加载语音缓存...');

  const db = await getDb();
  const voices = await db
    .select()
    .from(voicesTable)
    .where(eq(voicesTable.isActive, true))
    .orderBy(asc(voicesTable.sortOrder), desc(voicesTable.createdAt));

  const latestUpdatedAt = await getLatestUpdatedAt();

  voiceCache = {
    voices,
    lastUpdatedAt: latestUpdatedAt,
  };

  console.log(`✅ [VoiceCache] 缓存已更新，共 ${voices.length} 个语音，时间戳: ${latestUpdatedAt?.toISOString()}`);
}

/**
 * 获取缓存的语音列表
 *
 * 自动检查缓存有效性，无效则重新加载
 */
async function getCachedVoices(): Promise<VoiceRecord[]> {
  const valid = await isCacheValid();

  if (!valid) {
    await loadVoicesIntoCache();
  } else {
    console.log('📦 [VoiceCache] 使用缓存数据');
  }

  return voiceCache.voices;
}

// ==================== 数据转换 ====================

// 将数据库模型转换为返回类型
function toVoice(model: VoiceRecord): Voice {
  return {
    id: String(model.id),
    name: model.name,
    display_name: model.displayName || model.name,
    provider: model.provider,
    locale: model.locale,
    country: model.country,
    role: model.role,
    gender: model.gender as 'male' | 'female' | 'neutral',
    avatar_url: model.avatarUrl,
    voice_sample_url: model.voiceSampleUrl,
    voice_sample_text: model.voiceSampleText,
    tags: model.tags as string[],
    style_list: model.styleList as string[],
    is_active: model.isActive,
    sort_order: model.sortOrder,
    created_at: model.createdAt?.toISOString(),
    updated_at: model.updatedAt?.toISOString(),
  };
}

// ==================== Server Actions ====================

/**
 * 获取语音列表（支持过滤和分页）
 *
 * 使用缓存优化，在内存中进行过滤
 */
export async function listVoices(filters: VoiceFilters = {}): Promise<VoiceListResponse> {
  const {
    provider,
    country,
    language,
    locale,
    role,
    gender,
    tag,
    is_active = true,
    page = 1,
    page_size = 20,
  } = filters;

  // 从缓存获取所有语音
  let voices = await getCachedVoices();

  // 如果查询非活跃语音，需要直接查数据库（缓存只存活跃的）
  if (!is_active) {
    const db = await getDb();
    voices = await db
      .select()
      .from(voicesTable)
      .where(eq(voicesTable.isActive, false))
      .orderBy(asc(voicesTable.sortOrder), desc(voicesTable.createdAt));
  }

  // 在内存中过滤
  let filtered = voices;

  if (provider) {
    filtered = filtered.filter(v => v.provider === provider);
  }
  if (country) {
    filtered = filtered.filter(v => v.country === country);
  }
  if (role) {
    filtered = filtered.filter(v => v.role === role);
  }
  if (gender) {
    filtered = filtered.filter(v => v.gender === gender);
  }

  // locale 精确匹配
  if (locale) {
    filtered = filtered.filter(v => v.locale === locale);
  } else if (language) {
    // language 前缀匹配
    filtered = filtered.filter(v => v.locale?.startsWith(`${language}-`));
  }

  // 标签过滤
  if (tag) {
    filtered = filtered.filter(v => {
      const tags = v.tags as string[];
      return tags?.includes(tag);
    });
  }

  // 计算分页
  const total = filtered.length;
  const total_pages = Math.ceil(total / page_size);
  const start = (page - 1) * page_size;
  const end = start + page_size;
  const paginatedVoices = filtered.slice(start, end);

  return {
    voices: paginatedVoices.map(toVoice),
    total,
    page,
    page_size,
    total_pages,
  };
}

/**
 * 根据 ID 获取单个语音
 */
export async function getVoiceById(id: number): Promise<Voice | null> {
  // 先从缓存查找
  const voices = await getCachedVoices();
  const voice = voices.find(v => v.id === id);

  if (voice) {
    return toVoice(voice);
  }

  // 缓存没有，查数据库（可能是非活跃的）
  const db = await getDb();
  const dbVoice = await db.query.voices.findFirst({
    where: eq(voicesTable.id, id),
  });

  if (!dbVoice) return null;

  return toVoice(dbVoice);
}

/**
 * 根据 name 获取单个语音
 */
export async function getVoiceByName(name: string): Promise<Voice | null> {
  // 先从缓存查找
  const voices = await getCachedVoices();
  const voice = voices.find(v => v.name === name);

  if (voice) {
    return toVoice(voice);
  }

  // 缓存没有，查数据库
  const db = await getDb();
  const dbVoice = await db.query.voices.findFirst({
    where: eq(voicesTable.name, name),
  });

  if (!dbVoice) return null;

  return toVoice(dbVoice);
}

/**
 * 获取可用的国家列表
 */
export async function getDistinctCountries(): Promise<string[]> {
  const voices = await getCachedVoices();
  const countries = [...new Set(voices.map(v => v.country).filter((c): c is string => c !== null))];
  return countries.sort();
}

/**
 * 获取可用的角色列表
 */
export async function getDistinctRoles(): Promise<string[]> {
  const voices = await getCachedVoices();
  const roles = [...new Set(voices.map(v => v.role).filter((r): r is string => r !== null))];
  return roles.sort();
}

/**
 * 获取可用的语言区域列表
 */
export async function getDistinctLocales(): Promise<string[]> {
  const voices = await getCachedVoices();
  const locales = [...new Set(voices.map(v => v.locale).filter((l): l is string => l !== null))];
  return locales.sort();
}

/**
 * 根据标签搜索语音
 */
export async function searchVoicesByTags(
  tags: string[],
  limit: number = 50
): Promise<Voice[]> {
  const voices = await getCachedVoices();

  // 在内存中过滤包含任意标签的语音
  const filtered = voices
    .filter(v => {
      const voiceTags = v.tags as string[];
      return voiceTags && tags.some(t => voiceTags.includes(t));
    })
    .slice(0, limit);

  return filtered.map(toVoice);
}

/**
 * 强制刷新缓存
 *
 * 用于管理后台更新语音数据后手动刷新
 */
export async function refreshVoiceCache(): Promise<void> {
  await loadVoicesIntoCache();
}