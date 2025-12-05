'use server';

/**
 * Fish Audio TTS 语音同步 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { getLocaleInfo } from '@/utils/localeMapper';
import { uploadImage } from '@/lib/services/r2-storage';
import * as OpenCC from 'opencc-js';
import * as XLSX from 'xlsx';

/**
 * 同步结果
 */
interface SyncResult {
  success: boolean;
  message: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
}

/**
 * 语言统计信息
 */
interface FishLanguageStats {
  language: string;
  languageName: string;
  fishCount: number;
  dbCount: number;
  sampleCount: number;
  avatarCount: number;
  canSync: boolean;
}

/**
 * Fish Audio API 返回的模型信息
 */
interface FishVoiceModel {
  _id: string;
  type: string;
  title: string;
  description: string;
  cover_image: string;
  train_mode: string;
  state: string;
  tags: string[];
  samples: Array<{
    title: string;
    text: string;
    task_id: string;
    audio: string;
  }>;
  created_at: string;
  updated_at: string;
  languages: string[];
  visibility: string;
  lock_visibility: boolean;
  default_text: string;
  like_count: number;
  mark_count: number;
  shared_count: number;
  task_count: number;
  unliked: boolean;
  liked: boolean;
  marked: boolean;
  author: {
    _id: string;
    nickname: string;
    avatar: string;
  };
}

/**
 * Fish Audio API 列表响应
 */
interface FishVoiceListResponse {
  total: number;
  items: FishVoiceModel[];
}

/**
 * 获取 Fish Audio API Token
 */
function getFishApiToken(): string {
  const token = process.env.FISH_AUDIO_API_KEY;
  if (!token) {
    throw new Error('未配置 FISH_AUDIO_API_KEY 环境变量');
  }
  return token;
}

/**
 * 从 Fish Audio API 获取语音模型列表
 * @param pageSize 每页数量
 * @param pageNumber 页码
 * @param language 语言筛选
 * @param sortBy 排序字段: score(热度), task_count(使用次数), created_at(创建时间)
 */
async function fetchVoicesFromFish(
  pageSize: number = 100,
  pageNumber: number = 1,
  language?: string,
  sortBy?: string
): Promise<FishVoiceListResponse> {
  const token = getFishApiToken();

  let url = `https://api.fish.audio/model?page_size=${pageSize}&page_number=${pageNumber}`;
  if (language) {
    url += `&language=${language}`;
  }
  if (sortBy) {
    url += `&sort_by=${sortBy}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data as FishVoiceListResponse;
}

/**
 * 获取单个语音模型详情
 */
async function fetchVoiceDetail(modelId: string): Promise<FishVoiceModel> {
  const token = getFishApiToken();

  const response = await fetch(`https://api.fish.audio/model/${modelId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio API 请求失败: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * 语言代码映射（Fish 使用 ISO 639-1 两位代码）
 */
const FISH_LANGUAGE_MAP: Record<string, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  ar: 'ar-SA',
  hi: 'hi-IN',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  ms: 'ms-MY',
  tr: 'tr-TR',
  pl: 'pl-PL',
  nl: 'nl-NL',
  sv: 'sv-SE',
  da: 'da-DK',
  no: 'no-NO',
  fi: 'fi-FI',
  cs: 'cs-CZ',
  el: 'el-GR',
  he: 'he-IL',
  uk: 'uk-UA',
  ro: 'ro-RO',
  hu: 'hu-HU',
  bg: 'bg-BG',
  hr: 'hr-HR',
  sk: 'sk-SK',
  sl: 'sl-SI',
  lt: 'lt-LT',
  lv: 'lv-LV',
  et: 'et-EE',
  ca: 'ca-ES',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ur: 'ur-PK',
  fa: 'fa-IR',
  sw: 'sw-KE',
  af: 'af-ZA',
  fil: 'fil-PH',
  mn: 'mn-MN',
  ne: 'ne-NP',
  si: 'si-LK',
  km: 'km-KH',
  lo: 'lo-LA',
  my: 'my-MM',
  ka: 'ka-GE',
  am: 'am-ET',
  zu: 'zu-ZA',
};

/**
 * 标准化语言代码
 */
function normalizeLanguage(fishLanguage: string): string {
  return FISH_LANGUAGE_MAP[fishLanguage] || fishLanguage;
}

/**
 * 获取国家代码
 */
function getCountryFromLanguage(language: string): string {
  const normalized = normalizeLanguage(language);
  const parts = normalized.split('-');
  if (parts.length >= 2) {
    return parts[1].toUpperCase();
  }
  return language.toUpperCase();
}

/**
 * 获取语言名称
 */
function getLanguageName(language: string): string {
  const normalized = normalizeLanguage(language);
  const info = getLocaleInfo(normalized);
  if (info) return info.name;

  // 常用语言的默认名称
  const defaultNames: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    ar: 'العربية',
  };
  return defaultNames[language] || language;
}

/**
 * 构建 tags 数组
 */
function buildTags(model: FishVoiceModel): string[] {
  const tags: string[] = [];

  // 添加模型原有的 tags
  if (model.tags && model.tags.length > 0) {
    tags.push(...model.tags);
  }

  // 添加训练模式
  if (model.train_mode) {
    tags.push(model.train_mode);
  }

  // 添加热度标签（基于使用次数）
  if (model.task_count > 100000) {
    tags.push('热门');
  }

  return tags;
}

/**
 * 构建 Fish Audio 封面图 URL
 * Fish Audio 使用 Cloudflare R2 CDN，格式为：
 * https://public-platform.r2.fish.audio/cdn-cgi/image/width=200,format=webp/coverimage/{id}
 */
function buildCoverImageUrl(coverImage: string, width: number = 200): string {
  if (!coverImage) return '';
  // coverImage 格式为 "coverimage/xxx" 或完整 URL
  if (coverImage.startsWith('http')) return coverImage;
  return `https://public-platform.r2.fish.audio/cdn-cgi/image/width=${width},format=webp/${coverImage}`;
}

// 简体中文转繁体中文转换器
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });

/**
 * 将简体中文转换为繁体中文
 */
function toTraditionalChinese(text: string): string {
  if (!text) return text;
  return s2tConverter(text);
}

/**
 * 下载 Fish Audio 封面图并上传到我们的 R2
 * @param coverImage Fish Audio 的 cover_image 字段（如 "coverimage/xxx"）
 * @param modelId 模型 ID，用于生成文件名
 * @returns 上传后的 R2 URL，失败则返回空字符串
 */
async function downloadAndUploadAvatar(coverImage: string, modelId: string): Promise<string> {
  if (!coverImage) return '';

  try {
    // 构建 Fish Audio 封面图 URL
    const sourceUrl = buildCoverImageUrl(coverImage, 400); // 使用较大尺寸以保证质量

    console.log(`📥 下载头像: ${sourceUrl}`);

    // 下载图片
    const response = await fetch(sourceUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`❌ 下载头像失败: ${response.status}`);
      return '';
    }

    // 获取图片数据
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 确定 content type
    const contentType = response.headers.get('content-type') || 'image/webp';

    // 生成文件名（使用 modelId 确保唯一性）
    const extension = contentType.includes('webp') ? 'webp' :
                      contentType.includes('png') ? 'png' :
                      contentType.includes('gif') ? 'gif' : 'jpg';
    const fileName = `fish_${modelId}.${extension}`;

    // 上传到 R2
    const r2Url = await uploadImage(imageBuffer, fileName, contentType, 'voice-avatars/fish');

    console.log(`✅ 头像上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ 下载/上传头像失败 (${modelId}):`, error);
    return '';
  }
}

/**
 * 获取 Fish Audio 所有语言及统计信息
 */
export async function getFishVoiceStatsByLanguage(): Promise<FishLanguageStats[]> {
  await verifyAdminWithoutDb();

  try {
    // 从 Fish Audio API 获取第一页数据，主要获取 total 和语言分布
    const firstPage = await fetchVoicesFromFish(100, 1);

    // 收集所有语言
    const languageSet = new Set<string>();
    for (const model of firstPage.items) {
      for (const lang of model.languages) {
        languageSet.add(lang);
      }
    }

    // 获取数据库中 Fish 语音的统计（provider = 'fish'）
    const dbStats = await prisma.voices.groupBy({
      by: ['locale'],
      where: { provider: 'fish' },
      _count: { id: true },
    });

    const dbCountByLocale: Record<string, number> = {};
    for (const stat of dbStats) {
      dbCountByLocale[stat.locale] = stat._count.id;
    }

    // 获取已有语音样例和头像的统计
    const dbVoices = await prisma.voices.findMany({
      where: { provider: 'fish' },
      select: { locale: true, voice_sample_url: true, avatar_url: true },
    });

    const sampleCountByLocale: Record<string, number> = {};
    const avatarCountByLocale: Record<string, number> = {};
    for (const voice of dbVoices) {
      const hasSample =
        voice.voice_sample_url &&
        typeof voice.voice_sample_url === 'object' &&
        Object.keys(voice.voice_sample_url).length > 0;
      const hasAvatar = voice.avatar_url && voice.avatar_url.length > 0;

      if (hasSample) {
        sampleCountByLocale[voice.locale] = (sampleCountByLocale[voice.locale] || 0) + 1;
      }
      if (hasAvatar) {
        avatarCountByLocale[voice.locale] = (avatarCountByLocale[voice.locale] || 0) + 1;
      }
    }

    // 构建结果
    const results: FishLanguageStats[] = [];
    for (const language of Array.from(languageSet)) {
      const normalizedLocale = normalizeLanguage(language);
      const dbCount = dbCountByLocale[normalizedLocale] || 0;
      const sampleCount = sampleCountByLocale[normalizedLocale] || 0;
      const avatarCount = avatarCountByLocale[normalizedLocale] || 0;

      // Fish API 按语言筛选需要额外请求，这里先显示 0
      // 实际 fishCount 需要单独请求每个语言的数量
      results.push({
        language,
        languageName: getLanguageName(language),
        fishCount: 0, // 需要额外请求
        dbCount,
        sampleCount,
        avatarCount,
        canSync: true, // Fish 总是可以同步
      });
    }

    // 按语言排序
    results.sort((a, b) => a.language.localeCompare(b.language));

    return results;
  } catch (error) {
    console.error('获取 Fish 语音统计失败:', error);
    throw error;
  }
}

/**
 * 获取 Fish Audio 热门语音列表（用于同步）
 * @param pageSize 每页数量
 * @param pageNumber 页码
 * @param language 语言筛选
 * @param sortBy 排序字段: score(热度), task_count(使用次数), created_at(创建时间)
 */
export async function getFishPopularVoices(
  pageSize: number = 20,
  pageNumber: number = 1,
  language?: string,
  sortBy?: string
): Promise<{
  total: number;
  items: Array<{
    id: string;
    title: string;
    description: string;
    coverImage: string;
    languages: string[];
    author: string;
    taskCount: number;
    likeCount: number;
    tags: string[];
    samples: Array<{
      title: string;
      text: string;
      audioUrl: string;
    }>;
  }>;
}> {
  await verifyAdminWithoutDb();

  try {
    const data = await fetchVoicesFromFish(pageSize, pageNumber, language, sortBy);

    const items = data.items.map((model) => ({
      id: model._id,
      title: model.title,
      description: model.description,
      coverImage: buildCoverImageUrl(model.cover_image),
      languages: model.languages,
      author: model.author?.nickname || 'Unknown',
      taskCount: model.task_count,
      likeCount: model.like_count,
      tags: model.tags,
      samples: model.samples.map((s) => ({
        title: s.title,
        text: s.text,
        audioUrl: s.audio,
      })),
    }));

    return {
      total: data.total,
      items,
    };
  } catch (error) {
    console.error('获取 Fish 热门语音失败:', error);
    throw error;
  }
}

/**
 * 同步单个 Fish 语音到数据库
 * @param modelId Fish Audio 模型 ID
 * @param targetLocale 目标语言区域（可选，如 'zh-TW'），不传则使用模型的默认语言
 */
export async function syncFishVoice(
  modelId: string,
  targetLocale?: string
): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    // 获取语音详情
    const model = await fetchVoiceDetail(modelId);

    // 确定目标语言
    const primaryLanguage = model.languages[0] || 'en';
    const normalizedLocale = targetLocale || normalizeLanguage(primaryLanguage);

    // 构建 name: locale:id 格式
    const voiceName = `${normalizedLocale}:${model._id}`;

    // 检查是否已存在
    const existing = await prisma.voices.findFirst({
      where: {
        provider: 'fish',
        name: voiceName,
      },
    });

    if (existing) {
      return {
        success: true,
        message: `该语音已存在 (${normalizedLocale})`,
        skipped: 1,
      };
    }

    // 构建语音样例 URL
    const voiceSampleUrl: Record<string, string> = {};
    if (model.samples && model.samples.length > 0) {
      voiceSampleUrl['default'] = model.samples[0].audio;
    }

    // 下载封面图并上传到我们的 R2
    const avatarUrl = await downloadAndUploadAvatar(model.cover_image, model._id);

    // 从 locale 获取国家代码
    const country = normalizedLocale.includes('-')
      ? normalizedLocale.split('-')[1].toUpperCase()
      : getCountryFromLanguage(primaryLanguage);

    // 处理 display_name：如果是繁体中文则转换
    const displayName =
      normalizedLocale === 'zh-TW' ? toTraditionalChinese(model.title) : model.title;

    // 插入数据库
    await prisma.voices.create({
      data: {
        name: voiceName,
        display_name: displayName,
        provider: 'fish',
        locale: normalizedLocale,
        country,
        role: 'Celebrity', // Fish 语音多为名人/角色克隆
        gender: 'unknown', // Fish 不提供性别信息
        avatar_url: avatarUrl,
        voice_sample_url: voiceSampleUrl,
        voice_sample_text: model.default_text || model.samples?.[0]?.text || '',
        tags: buildTags(model),
        style_list: ['default'],
        is_active: true,
        sort_order: 0,
      },
    });

    return {
      success: true,
      message: `成功同步 ${model.title} (${normalizedLocale})`,
      inserted: 1,
    };
  } catch (error) {
    console.error(`同步 Fish 语音失败 (${modelId}):`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 批量同步 Fish 热门语音
 * @param count 同步数量
 * @param language Fish API 语言筛选（如 'zh'）
 * @param targetLocale 目标语言区域（可选，如 'zh-TW'），不传则使用默认映射
 */
export async function syncFishPopularVoices(
  count: number = 50,
  language?: string,
  targetLocale?: string
): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log(`🔄 开始同步 Fish Audio 热门语音 (数量: ${count}, 语言: ${language || '全部'}, 目标: ${targetLocale || '默认'})...`);

    // 获取热门语音
    const pageSize = Math.min(count, 100);
    const data = await fetchVoicesFromFish(pageSize, 1, language);

    // 获取已存在的 name（格式为 locale:id）
    const existingVoices = await prisma.voices.findMany({
      where: { provider: 'fish' },
      select: { name: true },
    });
    const existingNames = new Set(existingVoices.map((v) => v.name));

    // 过滤出需要插入的
    const voicesToInsert = data.items.filter((m) => {
      const primaryLanguage = m.languages[0] || 'en';
      const locale = targetLocale || normalizeLanguage(primaryLanguage);
      const voiceName = `${locale}:${m._id}`;
      return !existingNames.has(voiceName);
    });

    if (voicesToInsert.length === 0) {
      return {
        success: true,
        message: '所有热门语音已同步',
        inserted: 0,
        skipped: data.items.length,
      };
    }

    let inserted = 0;
    let failed = 0;

    for (const model of voicesToInsert) {
      try {
        const primaryLanguage = model.languages[0] || 'en';
        const normalizedLocale = targetLocale || normalizeLanguage(primaryLanguage);
        const voiceName = `${normalizedLocale}:${model._id}`;

        const voiceSampleUrl: Record<string, string> = {};
        if (model.samples && model.samples.length > 0) {
          voiceSampleUrl['default'] = model.samples[0].audio;
        }

        // 下载封面图并上传到我们的 R2
        const avatarUrl = await downloadAndUploadAvatar(model.cover_image, model._id);

        // 从 locale 获取国家代码
        const country = normalizedLocale.includes('-')
          ? normalizedLocale.split('-')[1].toUpperCase()
          : getCountryFromLanguage(primaryLanguage);

        // 处理 display_name：如果是繁体中文则转换
        const displayName =
          normalizedLocale === 'zh-TW' ? toTraditionalChinese(model.title) : model.title;

        await prisma.voices.create({
          data: {
            name: voiceName,
            display_name: displayName,
            provider: 'fish',
            locale: normalizedLocale,
            country,
            role: 'Celebrity',
            gender: 'unknown',
            avatar_url: avatarUrl,
            voice_sample_url: voiceSampleUrl,
            voice_sample_text: model.default_text || model.samples?.[0]?.text || '',
            tags: buildTags(model),
            style_list: ['default'],
            is_active: true,
            sort_order: 0,
          },
        });

        inserted++;
        console.log(`✅ 同步成功: ${model.title} (${normalizedLocale})`);
      } catch (error) {
        console.error(`❌ 同步失败: ${model.title}`, error);
        failed++;
      }
    }

    return {
      success: true,
      message: `同步完成: 插入 ${inserted} 条，跳过 ${data.items.length - voicesToInsert.length} 条`,
      inserted,
      skipped: data.items.length - voicesToInsert.length,
      failed,
    };
  } catch (error) {
    console.error('批量同步 Fish 语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 从 name 字段提取 modelId
 * name 格式可能是 "locale:id" 或直接是 "id"（旧数据）
 */
function extractModelId(name: string): string {
  if (name.includes(':')) {
    return name.split(':').slice(1).join(':'); // 处理 id 中可能包含 : 的情况
  }
  return name;
}

/**
 * 更新 Fish 语音数据（刷新封面和样例）
 */
export async function updateFishVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始更新 Fish 语音数据...');

    // 获取数据库中所有 Fish 语音
    const dbVoices = await prisma.voices.findMany({
      where: { provider: 'fish' },
      select: { id: true, name: true, locale: true },
    });

    let updated = 0;
    let failed = 0;

    for (const dbVoice of dbVoices) {
      try {
        // 从 name 中提取 modelId
        const modelId = extractModelId(dbVoice.name);
        const model = await fetchVoiceDetail(modelId);

        const voiceSampleUrl: Record<string, string> = {};
        if (model.samples && model.samples.length > 0) {
          voiceSampleUrl['default'] = model.samples[0].audio;
        }

        const avatarUrl = buildCoverImageUrl(model.cover_image);

        // 处理 display_name：如果是繁体中文则转换
        const displayName =
          dbVoice.locale === 'zh-TW' ? toTraditionalChinese(model.title) : model.title;

        await prisma.voices.update({
          where: { id: dbVoice.id },
          data: {
            display_name: displayName,
            avatar_url: avatarUrl,
            voice_sample_url: voiceSampleUrl,
            voice_sample_text: model.default_text || model.samples?.[0]?.text || '',
            tags: buildTags(model),
          },
        });

        updated++;
      } catch (error) {
        console.error(`❌ 更新失败: ${dbVoice.name}`, error);
        failed++;
      }
    }

    console.log(`✅ 更新完成: ${updated} 条更新, ${failed} 条失败`);

    return {
      success: true,
      message: `更新完成: ${updated} 条更新`,
      updated,
      failed,
    };
  } catch (error) {
    console.error('更新 Fish 语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 同步 Fish 语音头像（使用封面图）
 */
export async function syncFishVoiceAvatars(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    // 获取没有头像的 Fish 语音
    const voices = await prisma.voices.findMany({
      where: {
        provider: 'fish',
        avatar_url: '',
      },
      select: { id: true, name: true },
    });

    if (voices.length === 0) {
      return {
        success: true,
        message: '所有 Fish 语音都已有头像',
        updated: 0,
      };
    }

    let updated = 0;
    let failed = 0;

    for (const voice of voices) {
      try {
        // 从 name 中提取 modelId
        const modelId = extractModelId(voice.name);
        const model = await fetchVoiceDetail(modelId);

        // 下载封面图并上传到我们的 R2
        let avatarUrl = '';
        if (model.cover_image) {
          avatarUrl = await downloadAndUploadAvatar(model.cover_image, modelId);
        }
        // 如果下载失败，使用 DiceBear 生成头像
        if (!avatarUrl) {
          avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(voice.name)}`;
        }

        await prisma.voices.update({
          where: { id: voice.id },
          data: { avatar_url: avatarUrl },
        });

        updated++;
      } catch (error) {
        console.error(`❌ 更新头像失败: ${voice.name}`, error);
        failed++;
      }
    }

    return {
      success: true,
      message: `已为 ${updated} 个语音更新头像`,
      updated,
      failed,
    };
  } catch (error) {
    console.error('同步 Fish 语音头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 删除 Fish 语音
 */
export async function deleteFishVoice(voiceId: number): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    await prisma.voices.delete({
      where: { id: voiceId },
    });

    return {
      success: true,
      message: '删除成功',
    };
  } catch (error) {
    console.error('删除 Fish 语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 导出结果接口
 */
interface ExportResult {
  success: boolean;
  message: string;
  data?: string; // base64 encoded xlsx
  filename?: string;
}

/**
 * 将 Fish 模型转换为 Excel 行数据
 */
function modelToExcelRow(model: FishVoiceModel, index: number) {
  return {
    序号: index + 1,
    ID: model._id,
    名称: model.title,
    描述: model.description,
    作者: model.author?.nickname || 'Unknown',
    语言: model.languages.join(', '),
    使用次数: model.task_count,
    点赞数: model.like_count,
    收藏数: model.mark_count,
    标签: model.tags.join(', '),
    训练模式: model.train_mode,
    状态: model.state,
    可见性: model.visibility,
    创建时间: model.created_at,
    更新时间: model.updated_at,
    封面图: buildCoverImageUrl(model.cover_image),
  };
}

/**
 * 导出 Fish Audio 语音列表为 Excel
 * 分批获取数据，每批 10000 条，边获取边写入
 * @param language 语言筛选（可选）
 */
export async function exportFishVoicesToExcel(language?: string): Promise<ExportResult> {
  await verifyAdminWithoutDb();

  try {
    console.log(`📊 开始导出 Fish Audio 语音数据 (语言: ${language || '全部'})...`);

    const batchSize = 10000;
    let pageNumber = 1;
    let totalFetched = 0;
    let total = 0;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet | null = null;

    // 分批获取数据
    while (true) {
      console.log(`📊 获取第 ${pageNumber} 批数据 (每批 ${batchSize} 条)...`);
      const data = await fetchVoicesFromFish(batchSize, pageNumber, language);

      if (pageNumber === 1) {
        total = data.total;
        console.log(`📊 总共 ${total} 条数据`);
      }

      if (data.items.length === 0) {
        break;
      }

      // 转换为 Excel 行数据
      const rows = data.items.map((model, index) =>
        modelToExcelRow(model, totalFetched + index)
      );

      if (worksheet === null) {
        // 第一批：创建工作表
        worksheet = XLSX.utils.json_to_sheet(rows);
      } else {
        // 后续批次：追加行（跳过表头）
        XLSX.utils.sheet_add_json(worksheet, rows, {
          skipHeader: true,
          origin: -1, // 追加到末尾
        });
      }

      totalFetched += data.items.length;
      console.log(`📊 已获取 ${totalFetched}/${total} 条`);

      // 如果已获取所有数据，退出循环
      if (totalFetched >= total || data.items.length < batchSize) {
        break;
      }

      pageNumber++;
    }

    if (!worksheet) {
      return {
        success: false,
        message: '没有数据可导出',
      };
    }

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fish Voices');

    // 设置列宽
    const columnWidths = [
      { wch: 6 }, // 序号
      { wch: 30 }, // ID
      { wch: 30 }, // 名称
      { wch: 50 }, // 描述
      { wch: 15 }, // 作者
      { wch: 15 }, // 语言
      { wch: 12 }, // 使用次数
      { wch: 10 }, // 点赞数
      { wch: 10 }, // 收藏数
      { wch: 30 }, // 标签
      { wch: 12 }, // 训练模式
      { wch: 10 }, // 状态
      { wch: 10 }, // 可见性
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
      { wch: 60 }, // 封面图
    ];
    worksheet['!cols'] = columnWidths;

    // 生成 buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 转换为 base64
    const base64 = Buffer.from(buffer).toString('base64');

    // 生成文件名
    const languageLabel = language ? `_${language}` : '';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `fish_voices${languageLabel}_${dateStr}.xlsx`;

    console.log(`✅ Excel 生成成功: ${filename} (${totalFetched} 条数据)`);

    return {
      success: true,
      message: `导出成功: ${totalFetched} 条数据`,
      data: base64,
      filename,
    };
  } catch (error) {
    console.error('导出 Fish 语音 Excel 失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '导出失败',
    };
  }
}