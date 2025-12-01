'use server';

/**
 * 语音模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import type { Voice, VoiceListResponse, VoiceFilters } from '@/types/voice';
// 从 Prisma Client 获取 voices 类型
type voices = Awaited<ReturnType<typeof prisma.voices.findFirst>>;

// ==================== 数据转换 ====================

// 将数据库模型转换为返回类型
function toVoice(model: NonNullable<voices>): Voice {
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
    created_at: model.created_at?.toISOString(),
    updated_at: model.updated_at?.toISOString(),
  };
}

// ==================== Server Actions ====================

/**
 * 获取语音列表（支持过滤和分页）
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

  // 构建查询条件
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
  // provider 排序：microsoft 在前，google 在后（按字母顺序 asc: google < microsoft）
  const voices = await prisma.voices.findMany({
    where,
    orderBy: [{ provider: 'desc' }, { sort_order: 'asc' }, { created_at: 'desc' }],
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
 * 获取可用的国家列表
 */
export async function getDistinctCountries(): Promise<string[]> {
  const voices = await prisma.voices.findMany({
    where: { is_active: true },
    select: { country: true },
    distinct: ['country'],
  });

  return voices.map(v => v.country).sort();
}

/**
 * 获取可用的角色列表
 */
export async function getDistinctRoles(): Promise<string[]> {
  const voices = await prisma.voices.findMany({
    where: { is_active: true },
    select: { role: true },
    distinct: ['role'],
  });

  return voices.map(v => v.role).sort();
}

/**
 * 获取可用的语言区域列表
 */
export async function getDistinctLocales(): Promise<string[]> {
  const voices = await prisma.voices.findMany({
    where: { is_active: true },
    select: { locale: true },
    distinct: ['locale'],
  });

  return voices.map(v => v.locale).sort();
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