'use server';

/**
 * 语音模块 Server Actions
 *
 * 使用 unstable_cache 缓存语音列表，减少数据库查询
 */
import { getDb } from '@/lib/db';
import { voices, ttsRecords } from '@/db/schema';
import { eq, and, desc, asc, count, like } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import type { Voice, VoiceListResponse, VoiceFilters } from '@/types/voice';

// 从 Drizzle 查询结果推断 voices 行类型
type VoicesRow = typeof voices.$inferSelect;

// ==================== 数据转换 ====================

// 将数据库模型转换为返回类型
// 注意：从缓存返回的数据，Date 已被序列化为字符串
function toVoice(model: VoicesRow): Voice {
  // 处理 Date 或已序列化的字符串
  const formatDate = (date: string | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date;
  };

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
    voice_sample_url: (model.voiceSampleUrl as Record<string, string>) || {},
    voice_sample_text: model.voiceSampleText,
    tags: model.tags as string[],
    style_list: model.styleList as string[],
    is_active: model.isActive,
    sort_order: model.sortOrder,
    created_at: formatDate(model.createdAt),
    updated_at: formatDate(model.updatedAt),
  };
}

// ==================== 缓存配置 ====================
// 缓存时间：1小时（语音数据变化不频繁）
const CACHE_REVALIDATE = 3600;

// 缓存：国家列表
const getCachedDistinctCountries = unstable_cache(
  async () => {
    const db = await getDb();
    const rows = await db.selectDistinct({ country: voices.country })
      .from(voices)
      .where(eq(voices.isActive, true));
    return rows.map(v => v.country).sort();
  },
  ['voices-distinct-countries'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：角色列表
const getCachedDistinctRoles = unstable_cache(
  async () => {
    const db = await getDb();
    const rows = await db.selectDistinct({ role: voices.role })
      .from(voices)
      .where(eq(voices.isActive, true));
    return rows.map(v => v.role).sort();
  },
  ['voices-distinct-roles'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：语言列表
const getCachedDistinctLocales = unstable_cache(
  async () => {
    const db = await getDb();
    const rows = await db.selectDistinct({ locale: voices.locale })
      .from(voices)
      .where(eq(voices.isActive, true));
    return rows.map(v => v.locale).sort();
  },
  ['voices-distinct-locales'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：celebrity 语言列表
const getCachedCelebrityLocales = unstable_cache(
  async () => {
    const db = await getDb();
    const rows = await db.selectDistinct({ locale: voices.locale })
      .from(voices)
      .where(and(eq(voices.isActive, true), eq(voices.role, 'celebrity')));
    return rows.map(v => v.locale).sort();
  },
  ['voices-celebrity-locales'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：按 locale 缓存全部语音（核心缓存策略）
// 每个 locale 的语音数量有限（通常 < 500），一次性缓存全部
// 客户端按需过滤（gender/role）和分页
const getCachedVoicesByLocale = unstable_cache(
  async (locale: string) => {
    const db = await getDb();
    const rows = await db.select().from(voices)
      .where(and(eq(voices.isActive, true), eq(voices.locale, locale)))
      .orderBy(desc(voices.sortOrder), desc(voices.provider), desc(voices.createdAt));
    return rows;
  },
  ['voices-by-locale'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：celebrity 语音列表
const getCachedCelebrityVoices = unstable_cache(
  async (locale?: string) => {
    const db = await getDb();
    const conditions = [eq(voices.isActive, true), eq(voices.role, 'celebrity')];
    if (locale) conditions.push(eq(voices.locale, locale));

    const rows = await db.select().from(voices)
      .where(and(...conditions))
      .orderBy(desc(voices.sortOrder))
      .limit(20);
    return rows;
  },
  ['voices-celebrity'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：TTS 落地页语音列表（按 locale + role 缓存）
const getCachedPromoVoices = unstable_cache(
  async (locale: string, role: string, pageSize: number) => {
    const db = await getDb();
    const rows = await db.select().from(voices)
      .where(and(eq(voices.isActive, true), eq(voices.locale, locale), eq(voices.role, role)))
      .orderBy(desc(voices.sortOrder))
      .limit(pageSize);
    return rows;
  },
  ['voices-promo'],
  { revalidate: CACHE_REVALIDATE }
);

// ==================== Server Actions ====================

/**
 * 获取语音列表（支持过滤和分页）
 * 优先使用 locale 缓存，在缓存数据上做客户端过滤和分页
 */
export async function listVoices(filters: VoiceFilters = {}): Promise<VoiceListResponse> {
  const db = await getDb();
  try {
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

    // 有 locale 时，使用缓存 + 客户端过滤
    if (locale && is_active === true) {
      const allVoices = await getCachedVoicesByLocale(locale);

      // 客户端过滤
      let filteredVoices = allVoices;

      if (provider) {
        filteredVoices = filteredVoices.filter(v => v.provider === provider);
      }
      if (country) {
        filteredVoices = filteredVoices.filter(v => v.country === country);
      }
      if (role) {
        filteredVoices = filteredVoices.filter(v => v.role === role);
      }
      if (gender) {
        filteredVoices = filteredVoices.filter(v => v.gender === gender);
      }
      if (tag) {
        filteredVoices = filteredVoices.filter(v =>
          v.tags && Array.isArray(v.tags) && (v.tags as string[]).includes(tag)
        );
      }

      // 客户端分页
      const total = filteredVoices.length;
      const total_pages = Math.ceil(total / page_size);
      const start = (page - 1) * page_size;
      const paginatedVoices = filteredVoices.slice(start, start + page_size);

      return {
        voices: paginatedVoices.map(toVoice),
        total,
        page,
        page_size,
        total_pages,
      };
    }

    // 无 locale 或需要复杂查询时走数据库
    const conditions = [eq(voices.isActive, is_active)];

    if (provider) conditions.push(eq(voices.provider, provider));
    if (country) conditions.push(eq(voices.country, country));
    if (role) conditions.push(eq(voices.role, role));
    if (gender) conditions.push(eq(voices.gender, gender));

    // locale 精确匹配
    if (locale) {
      conditions.push(eq(voices.locale, locale));
    } else if (language) {
      // language 前缀匹配
      conditions.push(like(voices.locale, `${language}-%`));
    }

    // 注意：标签过滤在 Drizzle 中需要用 SQL
    // PostgreSQL 的 @> 操作符（数组包含）
    // 在这里我们先跳过标签过滤，在结果中手动过滤
    const whereClause = and(...conditions);

    // 查询总数
    let totalResult: number;
    let voiceRows: VoicesRow[];

    if (tag) {
      // 带标签过滤：先查全部再手动过滤
      const allRows = await db.select().from(voices)
        .where(whereClause)
        .orderBy(desc(voices.sortOrder), desc(voices.provider), desc(voices.createdAt));

      const filtered = allRows.filter(v =>
        v.tags && Array.isArray(v.tags) && (v.tags as string[]).includes(tag)
      );

      totalResult = filtered.length;
      voiceRows = filtered.slice((page - 1) * page_size, page * page_size);
    } else {
      const [{ total }] = await db.select({ total: count() }).from(voices).where(whereClause);
      totalResult = total;

      voiceRows = await db.select().from(voices)
        .where(whereClause)
        .orderBy(desc(voices.sortOrder), desc(voices.provider), desc(voices.createdAt))
        .offset((page - 1) * page_size)
        .limit(page_size);
    }

    const total_pages = Math.ceil(totalResult / page_size);

    return {
      voices: voiceRows.map(toVoice),
      total: totalResult,
      page,
      page_size,
      total_pages,
    };
  } catch (error) {
    console.error('[listVoices] 数据库查询失败:', error);
    // 重新抛出错误，让调用方知道失败了
    throw error;
  }
}

/**
 * 根据 ID 获取单个语音
 */
export async function getVoiceById(id: number): Promise<Voice | null> {
  const db = await getDb();
  const [voice] = await db.select().from(voices).where(eq(voices.id, id)).limit(1);

  if (!voice) return null;

  return toVoice(voice);
}

/**
 * 根据 name 获取单个语音
 */
export async function getVoiceByName(name: string): Promise<Voice | null> {
  const db = await getDb();
  const [voice] = await db.select().from(voices).where(eq(voices.name, name)).limit(1);

  if (!voice) return null;

  return toVoice(voice);
}

/**
 * 获取可用的国家列表（使用缓存）
 */
export async function getDistinctCountries(): Promise<string[]> {
  return getCachedDistinctCountries();
}

/**
 * 获取可用的角色列表（使用缓存）
 */
export async function getDistinctRoles(): Promise<string[]> {
  return getCachedDistinctRoles();
}

/**
 * 获取可用的语言区域列表（使用缓存）
 */
export async function getDistinctLocales(): Promise<string[]> {
  return getCachedDistinctLocales();
}

/**
 * 根据标签搜索语音
 */
export async function searchVoicesByTags(
  tags: string[],
  limit: number = 50
): Promise<Voice[]> {
  const db = await getDb();
  // 查询所有活跃语音，然后手动过滤标签
  // PostgreSQL 的 @> 操作符（数组包含），用 OR 组合多个条件
  const allVoices = await db.select().from(voices)
    .where(eq(voices.isActive, true))
    .orderBy(desc(voices.provider), asc(voices.sortOrder), desc(voices.createdAt));

  const filtered = allVoices.filter(v =>
    v.tags && Array.isArray(v.tags) && tags.some(tag => (v.tags as string[]).includes(tag))
  );

  return filtered.slice(0, limit).map(toVoice);
}

/**
 * 获取 celebrity 语音列表（使用缓存）
 * 按 sort_order 从大到小排列
 */
export async function getCelebrityVoices(locale?: string): Promise<Voice[]> {
  try {
    const voiceRows = await getCachedCelebrityVoices(locale);
    return voiceRows.map(toVoice);
  } catch (error) {
    console.error('[getCelebrityVoices] 数据库查询失败:', error);
    return [];
  }
}

/**
 * 获取 celebrity 语音可用的语言列表（使用缓存）
 */
export async function getCelebrityLocales(): Promise<string[]> {
  try {
    return getCachedCelebrityLocales();
  } catch (error) {
    console.error('[getCelebrityLocales] 数据库查询失败:', error);
    return [];
  }
}

/**
 * 获取当前用户已使用的语音名称列表
 *
 * 从 tts_records 表中查询用户使用过的不重复 voice_name
 * 支持 Firebase 登录用户和匿名用户
 */
export async function getUsedVoiceNames(): Promise<string[]> {
  const db = await getDb();
  try {
    // 使用统一认证，支持登录用户和匿名用户
    const user = await getUserOrAnonymous();
    const userId = user.user_id;

    // 查询用户使用过的不重复 voice_name
    const records = await db.selectDistinct({ voiceName: ttsRecords.voiceName })
      .from(ttsRecords)
      .where(eq(ttsRecords.userId, userId));

    return records.map(r => r.voiceName);
  } catch {
    // 未登录或查询失败返回空数组
    return [];
  }
}

/**
 * 获取 TTS 落地页语音列表（使用缓存）
 * 专为落地页优化，按 locale + role 缓存
 */
export async function getPromoVoices(locale: string, role: string, pageSize: number = 22): Promise<Voice[]> {
  try {
    const voiceRows = await getCachedPromoVoices(locale, role, pageSize);
    return voiceRows.map(toVoice);
  } catch (error) {
    console.error('[getPromoVoices] 数据库查询失败:', error);
    return [];
  }
}

/**
 * 获取首页 TTS 演示用的语音列表（使用缓存）
 * 复用 getCachedVoicesByLocale 缓存，从中截取需要的数量
 */
export async function getSampleVoices(locale: string, limit: number = 3): Promise<Voice[]> {
  try {
    const voiceRows = await getCachedVoicesByLocale(locale);
    // 截取需要的数量
    return voiceRows.slice(0, limit).map(toVoice);
  } catch (error) {
    console.error('[getSampleVoices] 数据库查询失败:', error);
    return [];
  }
}

/**
 * 获取指定 locale 的全部语音（使用缓存）
 * 用于 /studio/voices 页面，客户端做过滤和分页
 */
export async function getVoicesByLocale(locale: string): Promise<Voice[]> {
  try {
    const voiceRows = await getCachedVoicesByLocale(locale);
    return voiceRows.map(toVoice);
  } catch (error) {
    console.error('[getVoicesByLocale] 数据库查询失败:', error);
    return [];
  }
}
