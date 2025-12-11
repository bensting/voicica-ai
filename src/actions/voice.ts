'use server';

/**
 * 语音模块 Server Actions
 *
 * 使用 unstable_cache 缓存语音列表，减少数据库查询
 */
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import type { Voice, VoiceListResponse, VoiceFilters } from '@/types/voice';
// 从 Prisma Client 获取 voices 类型
type voices = Awaited<ReturnType<typeof prisma.voices.findFirst>>;

// ==================== 数据转换 ====================

// 将数据库模型转换为返回类型
// 注意：从缓存返回的数据，Date 已被序列化为字符串
function toVoice(model: NonNullable<voices>): Voice {
  // 处理 Date 或已序列化的字符串
  const formatDate = (date: Date | string | null | undefined): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: String(model.id),
    name: model.name,
    display_name: model.display_name || model.name,
    provider: model.provider,
    locale: model.locale,
    country: model.country,
    role: model.role,
    gender: model.gender as 'male' | 'female' | 'neutral',
    avatar_url: model.avatar_url,
    voice_sample_url: (model.voice_sample_url as Record<string, string>) || {},
    voice_sample_text: model.voice_sample_text,
    tags: model.tags as string[],
    style_list: model.style_list as string[],
    is_active: model.is_active,
    sort_order: model.sort_order,
    created_at: formatDate(model.created_at),
    updated_at: formatDate(model.updated_at),
  };
}

// ==================== 缓存配置 ====================
// 缓存时间：1小时（语音数据变化不频繁）
const CACHE_REVALIDATE = 3600;

// 缓存：国家列表
const getCachedDistinctCountries = unstable_cache(
  async () => {
    const voices = await prisma.voices.findMany({
      where: { is_active: true },
      select: { country: true },
      distinct: ['country'],
    });
    return voices.map(v => v.country).sort();
  },
  ['voices-distinct-countries'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：角色列表
const getCachedDistinctRoles = unstable_cache(
  async () => {
    const voices = await prisma.voices.findMany({
      where: { is_active: true },
      select: { role: true },
      distinct: ['role'],
    });
    return voices.map(v => v.role).sort();
  },
  ['voices-distinct-roles'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：语言列表
const getCachedDistinctLocales = unstable_cache(
  async () => {
    const voices = await prisma.voices.findMany({
      where: { is_active: true },
      select: { locale: true },
      distinct: ['locale'],
    });
    return voices.map(v => v.locale).sort();
  },
  ['voices-distinct-locales'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：celebrity 语言列表
const getCachedCelebrityLocales = unstable_cache(
  async () => {
    const voices = await prisma.voices.findMany({
      where: { is_active: true, role: 'celebrity' },
      select: { locale: true },
      distinct: ['locale'],
    });
    return voices.map(v => v.locale).sort();
  },
  ['voices-celebrity-locales'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：按 locale 缓存全部语音（核心缓存策略）
// 每个 locale 的语音数量有限（通常 < 500），一次性缓存全部
// 客户端按需过滤（gender/role）和分页
const getCachedVoicesByLocale = unstable_cache(
  async (locale: string) => {
    const where = { is_active: true, locale };
    const voices = await prisma.voices.findMany({
      where,
      orderBy: [{ sort_order: 'desc' }, { provider: 'desc' }, { created_at: 'desc' }],
    });
    return voices;
  },
  ['voices-by-locale'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：celebrity 语音列表
const getCachedCelebrityVoices = unstable_cache(
  async (locale?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { is_active: true, role: 'celebrity' };
    if (locale) where.locale = locale;

    const voices = await prisma.voices.findMany({
      where,
      orderBy: [{ sort_order: 'desc' }],
      take: 20,
    });
    return voices;
  },
  ['voices-celebrity'],
  { revalidate: CACHE_REVALIDATE }
);

// 缓存：TTS 落地页语音列表（按 locale + role 缓存）
const getCachedPromoVoices = unstable_cache(
  async (locale: string, role: string, pageSize: number) => {
    const where = {
      is_active: true,
      locale,
      role,
    };

    const voices = await prisma.voices.findMany({
      where,
      orderBy: [{ sort_order: 'desc' }],
      take: pageSize,
    });
    return voices;
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
          v.tags && Array.isArray(v.tags) && v.tags.includes(tag)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      is_active,
    };

    if (provider) where.provider = provider;
    if (country) where.country = country;
    if (role) where.role = role;
    if (gender) where.gender = gender;

    // locale 精确匹配
    if (locale) {
      where.locale = locale;
    } else if (language) {
      // language 前缀匹配
      where.locale = { startsWith: `${language}-` };
    }

    // 标签过滤
    if (tag) {
      where.tags = { array_contains: tag };
    }

    // 查询总数
    const total = await prisma.voices.count({ where });

    // 分页查询
    const voices = await prisma.voices.findMany({
      where,
      orderBy: [{ sort_order: 'desc' }, { provider: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * page_size,
      take: page_size,
    });

    const total_pages = Math.ceil(total / page_size);

    return {
      voices: voices.map(toVoice),
      total,
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
  const voice = await prisma.voices.findUnique({
    where: { id },
  });

  if (!voice) return null;

  return toVoice(voice);
}

/**
 * 根据 name 获取单个语音
 */
export async function getVoiceByName(name: string): Promise<Voice | null> {
  const voice = await prisma.voices.findUnique({
    where: { name },
  });

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
  const voices = await prisma.voices.findMany({
    where: {
      is_active: true,
      OR: tags.map(tag => ({ tags: { array_contains: tag } })),
    },
    orderBy: [{ provider: 'desc' }, { sort_order: 'asc' }, { created_at: 'desc' }],
    take: limit,
  });

  return voices.map(toVoice);
}

/**
 * 获取 celebrity 语音列表（使用缓存）
 * 按 sort_order 从大到小排列
 */
export async function getCelebrityVoices(locale?: string): Promise<Voice[]> {
  try {
    const voices = await getCachedCelebrityVoices(locale);
    return voices.map(toVoice);
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
  try {
    // 使用统一认证，支持登录用户和匿名用户
    const user = await getUserOrAnonymous();
    const userId = user.user_id;

    // 查询用户使用过的不重复 voice_name
    const records = await prisma.tts_records.findMany({
      where: { user_id: userId },
      select: { voice_name: true },
      distinct: ['voice_name'],
    });

    return records.map(r => r.voice_name);
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
    const voices = await getCachedPromoVoices(locale, role, pageSize);
    return voices.map(toVoice);
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
    const voices = await getCachedVoicesByLocale(locale);
    // 截取需要的数量
    return voices.slice(0, limit).map(toVoice);
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
    const voices = await getCachedVoicesByLocale(locale);
    return voices.map(toVoice);
  } catch (error) {
    console.error('[getVoicesByLocale] 数据库查询失败:', error);
    return [];
  }
}