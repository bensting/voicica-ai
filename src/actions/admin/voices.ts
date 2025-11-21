'use server';

/**
 * 语音管理 Server Actions
 * 从 Azure TTS API 获取语音列表，同步到数据库
 */
import { headers } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { getLocaleInfo } from '@/utils/localeMapper';

// 管理员白名单
const ADMIN_EMAILS = ['admin@ai-voice-labs.com', 'bensting19@gmail.com'];

interface LocaleStats {
  locale: string;
  localeName: string;
  azureCount: number;
  dbCount: number;
  canSync: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  inserted?: number;
  skipped?: number;
  updated?: number;
}

/**
 * Azure TTS 返回的语音信息
 */
interface AzureVoice {
  Name: string;
  DisplayName: string;
  LocalName: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  LocaleName: string;
  StyleList?: string[];
  SampleRateHertz: string;
  VoiceType: string;
  Status: string;
  WordsPerMinute?: string;
}

/**
 * 验证管理员权限（不查询数据库）
 */
async function verifyAdminWithoutDb(): Promise<void> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未登录');
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
      throw new Error('无权限访问');
    }
  } catch (error) {
    console.error('❌ [Admin] 验证失败:', error);
    throw new Error('验证失败');
  }
}

/**
 * 从 Azure TTS API 获取所有语音列表
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech?tabs=streaming#get-a-list-of-voices
 */
async function fetchVoicesFromAzure(): Promise<AzureVoice[]> {
  const apiKey = process.env.MICROSOFT_TTS_API_KEY;
  const region = process.env.MICROSOFT_TTS_REGION || 'southeastasia';

  if (!apiKey) {
    throw new Error('未配置 MICROSOFT_TTS_API_KEY');
  }

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Azure API 请求失败: ${response.status}`);
  }

  const voices: AzureVoice[] = await response.json();

  if (!Array.isArray(voices)) {
    throw new Error('Azure API 返回数据格式错误');
  }

  return voices;
}

/**
 * 从 locale 中提取国家代码（如 en-US -> US）
 */
function getCountryFromLocale(locale: string): string {
  const parts = locale.split('-');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

/**
 * 获取所有语言区域及统计信息
 */
export async function getVoiceStatsByLocale(): Promise<LocaleStats[]> {
  await verifyAdminWithoutDb();

  try {
    // 从 Azure API 获取所有语音
    const azureVoices = await fetchVoicesFromAzure();

    // 按 locale 分组统计 Azure 数量
    const azureCountByLocale: Record<string, number> = {};
    for (const voice of azureVoices) {
      azureCountByLocale[voice.Locale] = (azureCountByLocale[voice.Locale] || 0) + 1;
    }

    // 从数据库统计每个 locale 的数量
    const dbStats = await prisma.voices.groupBy({
      by: ['locale'],
      _count: { locale: true },
    });

    const dbCountByLocale: Record<string, number> = {};
    for (const stat of dbStats) {
      dbCountByLocale[stat.locale] = stat._count.locale;
    }

    // 合并所有 locale
    const allLocales = new Set([
      ...Object.keys(azureCountByLocale),
      ...Object.keys(dbCountByLocale),
    ]);

    // 构建结果
    const result: LocaleStats[] = [];
    for (const locale of allLocales) {
      const azureCount = azureCountByLocale[locale] || 0;
      const dbCount = dbCountByLocale[locale] || 0;
      const localeOption = getLocaleInfo(locale);

      result.push({
        locale,
        localeName: localeOption?.name || locale,
        azureCount,
        dbCount,
        canSync: azureCount > dbCount,
      });
    }

    // 按 locale 排序
    result.sort((a, b) => a.locale.localeCompare(b.locale));

    return result;
  } catch (error) {
    console.error('获取语音统计失败:', error);
    throw error;
  }
}

/**
 * 获取所有可用的 locale 列表
 */
export async function getVoiceLocales(): Promise<string[]> {
  await verifyAdminWithoutDb();

  const azureVoices = await fetchVoicesFromAzure();
  const locales = new Set(azureVoices.map((v) => v.Locale));
  return Array.from(locales).sort();
}

/**
 * 按 locale 同步语音（只插入，不更新）
 */
export async function syncVoicesByLocale(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log(`🔄 开始同步 locale: ${locale}`);

    // 从 Azure API 获取该 locale 的语音
    const azureVoices = await fetchVoicesFromAzure();
    const localeVoices = azureVoices.filter((v) => v.Locale === locale);

    if (localeVoices.length === 0) {
      return {
        success: true,
        message: `locale ${locale} 没有可同步的语音`,
        inserted: 0,
        skipped: 0,
      };
    }

    // 获取数据库中已存在的语音名称（使用 ShortName 作为唯一标识）
    const existingVoices = await prisma.voices.findMany({
      where: { locale },
      select: { name: true },
    });
    const existingNames = new Set(existingVoices.map((v) => v.name));

    // 只插入不存在的语音
    let inserted = 0;
    let skipped = 0;

    for (const voice of localeVoices) {
      // 使用 ShortName 作为数据库中的 name（如 en-US-JennyNeural）
      if (existingNames.has(voice.ShortName)) {
        skipped++;
        continue;
      }

      await prisma.voices.create({
        data: {
          name: voice.ShortName,
          provider: 'microsoft',
          locale: voice.Locale,
          country: getCountryFromLocale(voice.Locale),
          role: voice.VoiceType || 'Neural',
          gender: voice.Gender,
          avatar_url: '', // Azure 不提供头像
          voice_sample_url: '', // 需要单独生成
          voice_sample_text: '',
          tags: [],
          style_list: voice.StyleList || [],
          is_active: voice.Status === 'GA', // GA = Generally Available
          sort_order: 0,
          display_name: voice.DisplayName,
        },
      });
      inserted++;
    }

    console.log(`✅ locale ${locale} 同步完成: 插入 ${inserted}, 跳过 ${skipped}`);

    return {
      success: true,
      message: `同步完成`,
      inserted,
      skipped,
    };
  } catch (error) {
    console.error(`❌ 同步 locale ${locale} 失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 生成 DiceBear 头像 URL
 * 使用 voice name 作为 seed，根据性别选择不同风格
 * @param voiceName 语音名称作为 seed
 * @param gender 性别 (Male/Female)
 */
function generateDiceBearUrl(voiceName: string, gender: string): string {
  // 使用 avataaars 风格，支持性别差异
  const style = 'avataaars';
  // 根据性别设置不同的选项
  const isMale = gender.toLowerCase() === 'male';

  // 构建 URL，使用 voice name 作为 seed 确保每个语音头像唯一且稳定
  const baseUrl = `https://api.dicebear.com/7.x/${style}/svg`;
  const params = new URLSearchParams({
    seed: voiceName,
    // 根据性别设置发型和配饰
    top: isMale ? 'shortHairShortFlat,shortHairShortWaved,shortHairShortCurly' : 'longHairStraight,longHairCurly,longHairBob',
    accessories: 'blank,prescription01,prescription02',
    accessoriesProbability: '30',
    facialHair: isMale ? 'beardLight,beardMedium,blank' : 'blank',
    facialHairProbability: isMale ? '30' : '0',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 同步所有语音的 DiceBear 头像
 * 只更新 avatar_url 为空的语音
 */
export async function syncVoiceAvatars(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始同步语音头像...');

    // 获取所有没有头像的语音
    const voicesWithoutAvatar = await prisma.voices.findMany({
      where: {
        OR: [
          { avatar_url: '' },
          { avatar_url: null as unknown as string },
        ],
      },
      select: {
        id: true,
        name: true,
        gender: true,
      },
    });

    if (voicesWithoutAvatar.length === 0) {
      return {
        success: true,
        message: '所有语音已有头像，无需同步',
        updated: 0,
      };
    }

    let updated = 0;

    for (const voice of voicesWithoutAvatar) {
      const avatarUrl = generateDiceBearUrl(voice.name, voice.gender);

      await prisma.voices.update({
        where: { id: voice.id },
        data: { avatar_url: avatarUrl },
      });

      updated++;
    }

    console.log(`✅ 头像同步完成: 更新 ${updated} 个语音`);

    return {
      success: true,
      message: `头像同步完成`,
      updated,
    };
  } catch (error) {
    console.error('❌ 同步头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 强制重新生成所有语音的头像
 */
export async function regenerateAllAvatars(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始重新生成所有语音头像...');

    const allVoices = await prisma.voices.findMany({
      select: {
        id: true,
        name: true,
        gender: true,
      },
    });

    if (allVoices.length === 0) {
      return {
        success: true,
        message: '数据库中没有语音',
        updated: 0,
      };
    }

    let updated = 0;

    for (const voice of allVoices) {
      const avatarUrl = generateDiceBearUrl(voice.name, voice.gender);

      await prisma.voices.update({
        where: { id: voice.id },
        data: { avatar_url: avatarUrl },
      });

      updated++;
    }

    console.log(`✅ 头像重新生成完成: 更新 ${updated} 个语音`);

    return {
      success: true,
      message: `头像重新生成完成`,
      updated,
    };
  } catch (error) {
    console.error('❌ 重新生成头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '重新生成失败',
    };
  }
}