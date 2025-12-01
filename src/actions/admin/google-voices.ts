'use server';

/**
 * Google TTS 语音同步 Server Actions
 */
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { getLocaleInfo } from '@/utils/localeMapper';
import { synthesizeSpeech as googleSynthesize } from '@/lib/services/google-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { getSampleText } from '@/config/voiceSampleTexts';

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
 * Locale 统计信息
 */
interface LocaleStats {
  locale: string;
  localeName: string;
  googleCount: number;
  dbCount: number;
  sampleCount: number; // 已有语音样例的数量
  avatarCount: number; // 已有头像的数量
  canSync: boolean;
}

/**
 * Google TTS 返回的语音信息
 * https://cloud.google.com/text-to-speech/docs/reference/rest/v1/voices/list
 */
interface GoogleVoice {
  name: string; // "zh-CN-Wavenet-A"
  languageCodes: string[]; // ["zh-CN"]
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL' | 'SSML_VOICE_GENDER_UNSPECIFIED';
  naturalSampleRateHertz: number;
}

/**
 * 从 Google TTS API 获取所有语音列表
 */
async function fetchVoicesFromGoogle(): Promise<GoogleVoice[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('未配置 GOOGLE_API_KEY 环境变量');
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.voices || !Array.isArray(data.voices)) {
    throw new Error('Google API 返回数据格式错误');
  }

  // 打印第一个语音的字段结构
  if (data.voices.length > 0) {
    console.log('=== Google Voice Sample ===');
    console.log(JSON.stringify(data.voices[0], null, 2));
    console.log('=== Total voices:', data.voices.length, '===');
  }

  return data.voices;
}

/**
 * 判断是否为传统命名格式（如 af-ZA-Standard-A）
 */
function isTraditionalName(name: string): boolean {
  // 传统格式包含 locale 前缀，如 zh-CN-Wavenet-A, en-US-Standard-B
  return /^[a-z]{2,3}-[A-Z]{2}/.test(name);
}

/**
 * 从语音名称解析显示名称
 * 传统格式: "ar-XA-Chirp3-HD-Achernar" -> "Chirp3-HD-Achernar"
 *          "zh-CN-Wavenet-A" -> "Wavenet-A"
 * 新格式: "Achernar" -> "Achernar"
 *
 * 规则：去掉 locale 前缀（如 ar-XA-, zh-CN-），保留剩余部分
 */
function parseDisplayName(name: string): string {
  if (isTraditionalName(name)) {
    // 传统格式: locale 前缀 + 其他部分
    // 匹配并去掉 locale 前缀（如 ar-XA-, zh-CN-, en-US-）
    const match = name.match(/^[a-z]{2,3}-[A-Z]{2}-(.+)$/);
    if (match) {
      return match[1]; // 返回 locale 后面的部分
    }
  }
  // 新格式直接返回名称
  return name;
}

/**
 * 标准化 locale 代码
 * Google 使用 ISO 639-3 代码，需要转换为常用的 ISO 639-1 代码
 * cmn-CN -> zh-CN (普通话/简体中文)
 * cmn-TW -> zh-TW (普通话/繁体中文)
 */
function normalizeLocale(locale: string): string {
  const LOCALE_MAPPING: Record<string, string> = {
    'cmn-CN': 'zh-CN',
    'cmn-TW': 'zh-TW',
  };
  return LOCALE_MAPPING[locale] || locale;
}

/**
 * 从 locale 获取国家代码（大写）
 */
function getCountryFromLocale(locale: string): string {
  const normalized = normalizeLocale(locale);
  const parts = normalized.split('-');
  if (parts.length >= 2) {
    return parts[1].toUpperCase();
  }
  return parts[0].toUpperCase();
}

/**
 * 将 Google gender 转换为小写格式
 */
function normalizeGender(ssmlGender: string): string {
  switch (ssmlGender) {
    case 'MALE':
      return 'male';
    case 'FEMALE':
      return 'female';
    case 'NEUTRAL':
      return 'neutral';
    default:
      return 'unknown';
  }
}

/**
 * 获取语音类型标签（用于识别）
 * 传统格式可以提取类型，新格式返回空
 */
function getVoiceTypeTag(name: string): string | null {
  if (isTraditionalName(name)) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('wavenet')) return 'Wavenet';
    if (nameLower.includes('neural2')) return 'Neural2';
    if (nameLower.includes('studio')) return 'Studio';
    if (nameLower.includes('polyglot')) return 'Polyglot';
    if (nameLower.includes('journey')) return 'Journey';
    if (nameLower.includes('news')) return 'News';
    if (nameLower.includes('standard')) return 'Standard';
    // Chirp 系列（注意顺序：先检查更具体的 chirp3，再检查 chirp）
    if (nameLower.includes('chirp3')) return 'Chirp3';
    if (nameLower.includes('chirp')) return 'Chirp';
  }
  return null;
}

/**
 * 构建 tags 数组
 */
function buildTags(name: string, sampleRate: number): string[] {
  const tags: string[] = [];

  // 添加采样率
  tags.push(`${sampleRate}Hz`);

  // 添加语音类型标签（如果有）
  const typeTag = getVoiceTypeTag(name);
  if (typeTag) {
    tags.push(typeTag);
  }

  return tags;
}

/**
 * 获取所有语言区域及统计信息（Google）
 */
export async function getGoogleVoiceStatsByLocale(): Promise<LocaleStats[]> {
  await verifyAdminWithoutDb();

  try {
    // 从 Google API 获取所有语音
    const googleVoices = await fetchVoicesFromGoogle();

    // 按 locale 分组统计 Google 数量（保留原始 locale 用于显示和 API 查询）
    // 同时记录标准化后的 locale 用于与数据库对比
    const googleCountByLocale: Record<string, number> = {};
    const localeToDbLocale: Record<string, string> = {}; // Google locale -> 标准化后的 DB locale
    for (const voice of googleVoices) {
      // Google 语音可能支持多个 locale，取第一个
      const locale = voice.languageCodes[0];
      if (locale) {
        googleCountByLocale[locale] = (googleCountByLocale[locale] || 0) + 1;
        localeToDbLocale[locale] = normalizeLocale(locale);
      }
    }

    // 获取数据库中 Google 语音的统计（provider = 'google'）
    const dbStats = await prisma.voices.groupBy({
      by: ['locale'],
      where: { provider: 'google' },
      _count: { id: true },
    });

    const dbCountByLocale: Record<string, number> = {};
    for (const stat of dbStats) {
      dbCountByLocale[stat.locale] = stat._count.id;
    }

    // 获取已有语音样例的统计（voice_sample_url 不为空对象）
    const dbVoices = await prisma.voices.findMany({
      where: { provider: 'google' },
      select: { locale: true, voice_sample_url: true, avatar_url: true },
    });

    // 统计每个 locale 的样例和头像数量
    const sampleCountByLocale: Record<string, number> = {};
    const avatarCountByLocale: Record<string, number> = {};
    for (const voice of dbVoices) {
      // 检查 voice_sample_url 是否有内容
      const hasSample = voice.voice_sample_url &&
        typeof voice.voice_sample_url === 'object' &&
        Object.keys(voice.voice_sample_url).length > 0;
      // 检查 avatar_url 是否有内容
      const hasAvatar = voice.avatar_url && voice.avatar_url.length > 0;

      if (hasSample) {
        sampleCountByLocale[voice.locale] = (sampleCountByLocale[voice.locale] || 0) + 1;
      }
      if (hasAvatar) {
        avatarCountByLocale[voice.locale] = (avatarCountByLocale[voice.locale] || 0) + 1;
      }
    }

    // 构建结果（只显示 Google API 返回的 locale）
    const results: LocaleStats[] = [];
    for (const locale of Object.keys(googleCountByLocale)) {
      const googleCount = googleCountByLocale[locale] || 0;
      // 使用标准化后的 locale 查询数据库数量
      const dbLocale = localeToDbLocale[locale];
      const dbCount = dbCountByLocale[dbLocale] || 0;
      const sampleCount = sampleCountByLocale[dbLocale] || 0;
      const avatarCount = avatarCountByLocale[dbLocale] || 0;
      // 尝试用标准化后的 locale 获取显示名称
      const localeInfo = getLocaleInfo(dbLocale) || getLocaleInfo(locale);

      results.push({
        locale, // 保留原始 Google locale 用于 API 调用
        localeName: localeInfo?.name || locale,
        googleCount,
        dbCount,
        sampleCount,
        avatarCount,
        canSync: googleCount > dbCount,
      });
    }

    // 按 locale 排序
    results.sort((a, b) => a.locale.localeCompare(b.locale));

    return results;
  } catch (error) {
    console.error('获取 Google 语音统计失败:', error);
    throw error;
  }
}

/**
 * 生成 Google 语音的唯一名称
 * 因为同一个语音名称（如 Achernar）可能对应多个 locale，
 * 所以需要组合 locale 和 name 作为唯一标识
 * 格式：locale:voiceName（如 en-US:Achernar）
 */
function buildGoogleVoiceName(locale: string, voiceName: string): string {
  return `${locale}:${voiceName}`;
}

/**
 * 按 locale 同步 Google 语音（只插入，不更新）
 */
export async function syncGoogleVoicesByLocale(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    // 标准化 locale（cmn-CN -> zh-CN）
    const dbLocale = normalizeLocale(locale);
    console.log(`🔄 开始同步 Google 语音 locale: ${locale} -> ${dbLocale}`);

    // 从 Google API 获取该 locale 的语音
    const googleVoices = await fetchVoicesFromGoogle();
    const localeVoices = googleVoices.filter((v) => v.languageCodes.includes(locale));

    if (localeVoices.length === 0) {
      return {
        success: true,
        message: `该 locale (${locale}) 没有可用的 Google 语音`,
        inserted: 0,
        skipped: 0,
      };
    }

    // 获取数据库中已存在的 Google 语音名称（使用标准化后的 locale 查询）
    const existingVoices = await prisma.voices.findMany({
      where: { provider: 'google', locale: dbLocale },
      select: { name: true },
    });
    const existingNames = new Set(existingVoices.map((v) => v.name));

    // 过滤出需要插入的语音（使用 dbLocale:name 格式检查）
    const voicesToInsert = localeVoices.filter(
      (v) => !existingNames.has(buildGoogleVoiceName(dbLocale, v.name))
    );

    if (voicesToInsert.length === 0) {
      return {
        success: true,
        message: `${locale} 的所有 Google 语音已同步`,
        inserted: 0,
        skipped: localeVoices.length,
      };
    }

    // 批量插入（使用标准化后的 locale）
    const insertData = voicesToInsert.map((voice) => ({
      name: buildGoogleVoiceName(dbLocale, voice.name), // 使用标准化的 locale:name 格式
      display_name: parseDisplayName(voice.name),
      provider: 'google',
      locale: dbLocale, // 使用标准化后的 locale
      country: getCountryFromLocale(locale),
      role: 'Professional',
      gender: normalizeGender(voice.ssmlGender),
      avatar_url: '',
      voice_sample_url: {},
      voice_sample_text: '',
      tags: buildTags(voice.name, voice.naturalSampleRateHertz),
      style_list: ['default'], // Google 没有风格概念，使用 default
      is_active: true,
      sort_order: 0,
    }));

    await prisma.voices.createMany({
      data: insertData,
      skipDuplicates: true,
    });

    console.log(`✅ 成功同步 ${locale} -> ${dbLocale}: 插入 ${voicesToInsert.length} 条`);

    return {
      success: true,
      message: `成功同步 ${locale}`,
      inserted: voicesToInsert.length,
      skipped: localeVoices.length - voicesToInsert.length,
    };
  } catch (error) {
    console.error(`同步 Google 语音失败 (${locale}):`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 同步所有 Google 语音
 */
export async function syncAllGoogleVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始同步所有 Google 语音...');

    const stats = await getGoogleVoiceStatsByLocale();
    const localesToSync = stats.filter((s) => s.canSync);

    if (localesToSync.length === 0) {
      return {
        success: true,
        message: '所有 Google 语音已同步完成',
        inserted: 0,
        skipped: 0,
      };
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const locale of localesToSync) {
      const result = await syncGoogleVoicesByLocale(locale.locale);
      if (result.success) {
        totalInserted += result.inserted || 0;
        totalSkipped += result.skipped || 0;
      } else {
        totalFailed++;
      }
    }

    return {
      success: true,
      message: `同步完成: 插入 ${totalInserted} 条，跳过 ${totalSkipped} 条`,
      inserted: totalInserted,
      skipped: totalSkipped,
      failed: totalFailed,
    };
  } catch (error) {
    console.error('同步所有 Google 语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 从数据库中的 name 字段解析出原始 Google 语音名称
 * locale:voiceName -> voiceName
 */
function parseGoogleVoiceNameFromDb(dbName: string): string {
  const colonIndex = dbName.indexOf(':');
  if (colonIndex !== -1) {
    return dbName.substring(colonIndex + 1);
  }
  return dbName;
}

/**
 * 更新所有 Google 语音数据
 */
export async function updateAllGoogleVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始更新所有 Google 语音数据...');

    // 从 Google API 获取所有语音
    const googleVoices = await fetchVoicesFromGoogle();

    // 构建映射（key: locale:voiceName）
    const googleVoiceMap = new Map<string, GoogleVoice>();
    for (const voice of googleVoices) {
      // 每个语音可能对应多个 locale，都要添加映射
      for (const locale of voice.languageCodes) {
        const key = buildGoogleVoiceName(locale, voice.name);
        googleVoiceMap.set(key, voice);
      }
    }

    // 获取数据库中所有 Google 语音
    const dbVoices = await prisma.voices.findMany({
      where: { provider: 'google' },
      select: { id: true, name: true, locale: true },
    });

    let updated = 0;
    let skipped = 0;

    for (const dbVoice of dbVoices) {
      // 尝试用数据库中的 name（locale:voiceName 格式）直接查找
      let googleVoice = googleVoiceMap.get(dbVoice.name);

      // 如果没找到，可能是旧格式数据，尝试用 locale + name 组合查找
      if (!googleVoice && dbVoice.locale) {
        const originalName = parseGoogleVoiceNameFromDb(dbVoice.name);
        googleVoice = googleVoiceMap.get(buildGoogleVoiceName(dbVoice.locale, originalName));
      }

      if (!googleVoice) {
        skipped++;
        console.log(`⏭️ 跳过（Google 中不存在）: ${dbVoice.name}`);
        continue;
      }

      const originalName = parseGoogleVoiceNameFromDb(dbVoice.name);

      await prisma.voices.update({
        where: { id: dbVoice.id },
        data: {
          gender: normalizeGender(googleVoice.ssmlGender),
          role: 'Professional',
          country: getCountryFromLocale(dbVoice.locale),
          display_name: parseDisplayName(originalName),
          tags: buildTags(originalName, googleVoice.naturalSampleRateHertz),
        },
      });

      updated++;
    }

    console.log(`✅ 更新完成: ${updated} 条更新, ${skipped} 条跳过`);

    return {
      success: true,
      message: `更新完成: ${updated} 条更新`,
      updated,
      skipped,
    };
  } catch (error) {
    console.error('更新 Google 语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 获取指定 locale 的 Google 语音列表（从 API 获取）
 */
export async function getGoogleVoicesByLocale(locale: string): Promise<{
  voices: Array<{
    name: string;
    displayName: string;
    gender: string;
    sampleRate: number;
    tags: string[];
  }>;
  total: number;
}> {
  await verifyAdminWithoutDb();

  try {
    const googleVoices = await fetchVoicesFromGoogle();
    const localeVoices = googleVoices.filter((v) => v.languageCodes.includes(locale));

    const voices = localeVoices.map((voice) => ({
      name: voice.name,
      displayName: parseDisplayName(voice.name),
      gender: normalizeGender(voice.ssmlGender),
      sampleRate: voice.naturalSampleRateHertz,
      tags: buildTags(voice.name, voice.naturalSampleRateHertz),
    }));

    // 按名称排序
    voices.sort((a, b) => a.name.localeCompare(b.name));

    return {
      voices,
      total: voices.length,
    };
  } catch (error) {
    console.error(`获取 ${locale} 语音列表失败:`, error);
    throw error;
  }
}

/**
 * 按 locale 生成语音样例（只为没有样例的语音生成）
 */
export async function syncGoogleVoiceSamplesByLocale(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    const dbLocale = normalizeLocale(locale);

    // 获取该 locale 没有语音样例的 Google 语音
    const voices = await prisma.voices.findMany({
      where: {
        provider: 'google',
        locale: dbLocale,
        OR: [
          { voice_sample_url: { equals: Prisma.DbNull } },
          { voice_sample_url: { equals: Prisma.JsonNull } },
          { voice_sample_url: { equals: {} } },
        ],
      },
      select: { id: true, name: true, locale: true, style_list: true },
    });

    if (voices.length === 0) {
      return {
        success: true,
        message: `${locale} 的所有语音都已有样例`,
        updated: 0,
      };
    }

    // 获取该 locale 的样例文本
    const sampleText = getSampleText(dbLocale) || 'Hello, this is a sample voice recording for demonstration purposes.';
    let updated = 0;
    let failed = 0;

    for (const voice of voices) {
      try {
        console.log(`🎤 生成 ${voice.name} 语音样例...`);

        // Google TTS 不支持 style，只生成 default
        const ttsResult = await googleSynthesize({
          text: sampleText,
          voiceName: voice.name,
          language: voice.locale,
        });

        // 上传到 R2
        const audioUrl = await uploadAudio(
          ttsResult.audioData,
          `voice-samples/google/${voice.name.replace(/:/g, '_')}_default.${ttsResult.format}`
        );

        // 更新数据库
        await prisma.voices.update({
          where: { id: voice.id },
          data: {
            voice_sample_url: { default: audioUrl },
            voice_sample_text: sampleText,
          },
        });

        updated++;
        console.log(`✅ ${voice.name} 样例生成成功`);
      } catch (error) {
        console.error(`❌ ${voice.name} 样例生成失败:`, error);
        failed++;
      }
    }

    return {
      success: true,
      message: `生成完成: ${updated} 成功, ${failed} 失败`,
      updated,
      failed,
    };
  } catch (error) {
    console.error(`生成 ${locale} 语音样例失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 按 locale 生成头像（只更新空头像）
 */
export async function syncGoogleVoiceAvatarsByLocale(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    const dbLocale = normalizeLocale(locale);

    const voices = await prisma.voices.findMany({
      where: {
        provider: 'google',
        locale: dbLocale,
        avatar_url: '',
      },
      select: { id: true, name: true, gender: true },
    });

    if (voices.length === 0) {
      return {
        success: true,
        message: `${locale} 的所有语音都已有头像`,
        updated: 0,
      };
    }

    let updated = 0;
    for (const voice of voices) {
      const seed = voice.name;
      const style = voice.gender === 'female' ? 'lorelei' : 'avataaars';
      const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

      await prisma.voices.update({
        where: { id: voice.id },
        data: { avatar_url: avatarUrl },
      });
      updated++;
    }

    return {
      success: true,
      message: `已为 ${updated} 个语音生成头像`,
      updated,
    };
  } catch (error) {
    console.error(`生成 ${locale} 头像失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 同步 Google 语音头像（使用 DiceBear）
 */
export async function syncGoogleVoiceAvatars(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    // 获取没有头像的 Google 语音
    const voices = await prisma.voices.findMany({
      where: {
        provider: 'google',
        avatar_url: '',
      },
      select: { id: true, name: true, gender: true },
    });

    if (voices.length === 0) {
      return {
        success: true,
        message: '所有 Google 语音都已有头像',
        updated: 0,
      };
    }

    let updated = 0;

    for (const voice of voices) {
      // 使用 DiceBear 生成头像
      const seed = voice.name;
      const style = voice.gender === 'female' ? 'lorelei' : 'avataaars';
      const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

      await prisma.voices.update({
        where: { id: voice.id },
        data: { avatar_url: avatarUrl },
      });

      updated++;
    }

    return {
      success: true,
      message: `已为 ${updated} 个语音生成头像`,
      updated,
    };
  } catch (error) {
    console.error('同步 Google 语音头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 重新生成所有 Google 语音头像
 */
export async function regenerateAllGoogleAvatars(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    const voices = await prisma.voices.findMany({
      where: { provider: 'google' },
      select: { id: true, name: true, gender: true },
    });

    let updated = 0;

    for (const voice of voices) {
      const seed = voice.name;
      const style = voice.gender === 'female' ? 'lorelei' : 'avataaars';
      const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

      await prisma.voices.update({
        where: { id: voice.id },
        data: { avatar_url: avatarUrl },
      });

      updated++;
    }

    return {
      success: true,
      message: `已重新生成 ${updated} 个头像`,
      updated,
    };
  } catch (error) {
    console.error('重新生成 Google 语音头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}