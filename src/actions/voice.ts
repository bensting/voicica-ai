'use server';

/**
 * 语音模块 Server Actions
 */
import prisma from '@/lib/prisma';
import type { Voice, VoiceListResponse, VoiceFilters } from '@/types/voice';

// 从 Prisma Client 获取 voices 类型
type voices = Awaited<ReturnType<typeof prisma.voices.findFirst>>;

// 重新导出类型供其他模块使用
export type { Voice, VoiceListResponse, VoiceFilters };

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
    voice_sample_url: model.voice_sample_url,
    voice_sample_text: model.voice_sample_text,
    tags: model.tags as string[],
    style_list: model.style_list as string[],
    is_active: model.is_active,
    sort_order: model.sort_order,
    created_at: model.created_at?.toISOString(),
    updated_at: model.updated_at?.toISOString(),
  };
}

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
  const where: Record<string, unknown> = {
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

  // 获取所有匹配的语音
  let voices = await prisma.voices.findMany({
    where,
    orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
  });

  // 标签过滤（在内存中进行，因为 JSON 数组查询）
  if (tag) {
    voices = voices.filter((v: NonNullable<voices>) => {
      const tags = v.tags as string[];
      return tags.includes(tag);
    });
  }

  // 计算分页
  const total = voices.length;
  const total_pages = Math.ceil(total / page_size);
  const start = (page - 1) * page_size;
  const end = start + page_size;
  const paginatedVoices = voices.slice(start, end);

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
  const result = await prisma.voices.findMany({
    where: { is_active: true },
    select: { country: true },
    distinct: ['country'],
    orderBy: { country: 'asc' },
  });

  return result.map((r: { country: string }) => r.country);
}

/**
 * 获取可用的角色列表
 */
export async function getDistinctRoles(): Promise<string[]> {
  const result = await prisma.voices.findMany({
    where: { is_active: true },
    select: { role: true },
    distinct: ['role'],
    orderBy: { role: 'asc' },
  });

  return result.map((r: { role: string }) => r.role);
}

/**
 * 获取可用的语言区域列表
 */
export async function getDistinctLocales(): Promise<string[]> {
  const result = await prisma.voices.findMany({
    where: { is_active: true },
    select: { locale: true },
    distinct: ['locale'],
    orderBy: { locale: 'asc' },
  });

  return result.map((r: { locale: string }) => r.locale);
}

/**
 * 根据标签搜索语音
 */
export async function searchVoicesByTags(
  tags: string[],
  limit: number = 50
): Promise<Voice[]> {
  // 获取所有活跃语音
  const allVoices = await prisma.voices.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }],
  });

  // 在内存中过滤包含任意标签的语音
  const filtered = allVoices
    .filter((v: NonNullable<voices>) => {
      const voiceTags = v.tags as string[];
      return tags.some((t) => voiceTags.includes(t));
    })
    .slice(0, limit);

  return filtered.map(toVoice);
}
