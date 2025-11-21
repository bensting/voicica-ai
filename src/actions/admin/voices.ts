'use server';

/**
 * 语音管理 Server Actions
 * 从 Azure TTS API 获取语音列表，同步到数据库
 */
import { headers } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { getLocaleInfo } from '@/utils/localeMapper';
import { synthesizeSpeech } from '@/lib/services/azure-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { getSampleText } from '@/config/voiceSampleTexts';

// 管理员白名单
const ADMIN_EMAILS = ['admin@ai-voice-labs.com', 'bensting19@gmail.com'];

interface LocaleStats {
  locale: string;
  localeName: string;
  azureCount: number;
  dbCount: number;
  avatarCount: number;
  sampleCount: number;
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
 * 从 locale 中提取国家代码
 * - 普通情况: en-US -> US
 * - zh 开头的特殊处理: zh-CN-liaoning -> CN（取第二段）
 */
function getCountryFromLocale(locale: string): string {
  const parts = locale.split('-');
  if (parts.length < 2) return '';

  // zh 开头的 locale，国家代码在第二段（如 zh-CN, zh-CN-liaoning, zh-TW）
  if (parts[0] === 'zh') {
    return parts[1].toUpperCase();
  }

  // 其他语言取最后一段
  return parts[parts.length - 1].toUpperCase();
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

    // 统计每个 locale 有头像的语音数量
    const avatarStats = await prisma.voices.groupBy({
      by: ['locale'],
      where: {
        avatar_url: { not: '' },
      },
      _count: { locale: true },
    });

    const avatarCountByLocale: Record<string, number> = {};
    for (const stat of avatarStats) {
      avatarCountByLocale[stat.locale] = stat._count.locale;
    }

    // 统计每个 locale 有样本的语音数量
    const sampleStats = await prisma.voices.groupBy({
      by: ['locale'],
      where: {
        voice_sample_url: { not: '' },
      },
      _count: { locale: true },
    });

    const sampleCountByLocale: Record<string, number> = {};
    for (const stat of sampleStats) {
      sampleCountByLocale[stat.locale] = stat._count.locale;
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
      const avatarCount = avatarCountByLocale[locale] || 0;
      const sampleCount = sampleCountByLocale[locale] || 0;
      const localeOption = getLocaleInfo(locale);

      result.push({
        locale,
        localeName: localeOption?.name || locale,
        azureCount,
        dbCount,
        avatarCount,
        sampleCount,
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
          gender: voice.Gender.toLowerCase(),
          avatar_url: '', // Azure 不提供头像
          voice_sample_url: '', // 需要单独生成
          voice_sample_text: '',
          tags: [],
          style_list: voice.StyleList && voice.StyleList.length > 0
            ? (voice.StyleList.includes('default') ? voice.StyleList : ['default', ...voice.StyleList])
            : ['default'],
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
 * 使用 voice name 的哈希作为 seed
 * @param voiceName 语音名称
 * @param gender 性别 (Male/Female)
 */
function generateDiceBearUrl(voiceName: string, gender: string): string {
  // 简单哈希函数生成稳定的 seed
  const hashCode = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const seed = hashCode(voiceName);
  // 根据性别选择不同风格：男性用 avataaars，女性用 lorelei
  const isMale = gender.toLowerCase() === 'male';
  const style = isMale ? 'avataaars' : 'lorelei';

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
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
        avatar_url: '',
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

/**
 * 为指定 locale 的语音生成样本音频
 * 只生成 voice_sample_url 为空的语音
 */
export async function generateVoiceSamples(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log(`🎤 开始生成 ${locale} 的语音样本...`);

    // 获取该 locale 下没有样本的语音
    const voicesWithoutSample = await prisma.voices.findMany({
      where: {
        locale,
        voice_sample_url: '',
      },
      select: {
        id: true,
        name: true,
        locale: true,
      },
    });

    if (voicesWithoutSample.length === 0) {
      return {
        success: true,
        message: `${locale} 所有语音已有样本，无需生成`,
        updated: 0,
      };
    }

    const sampleText = getSampleText(locale);

    // 如果没有配置该语言的示例文本，跳过
    if (!sampleText) {
      return {
        success: true,
        message: `${locale} 暂不支持生成样本（未配置示例文本）`,
        updated: 0,
      };
    }

    let updated = 0;
    let failed = 0;

    for (const voice of voicesWithoutSample) {
      try {
        console.log(`🎙️ 生成样本: ${voice.name}`);

        // 调用 Azure TTS 生成音频
        const ttsResult = await synthesizeSpeech({
          text: sampleText,
          voiceName: voice.name,
          language: voice.locale,
        });

        // 上传到 R2
        const fileName = `${voice.name}.mp3`;
        const audioUrl = await uploadAudio(
          ttsResult.audioData,
          fileName,
          'audio/mpeg',
          'voice-samples'
        );

        // 更新数据库
        await prisma.voices.update({
          where: { id: voice.id },
          data: {
            voice_sample_url: audioUrl,
            voice_sample_text: sampleText,
          },
        });

        updated++;
        console.log(`✅ 样本生成成功: ${voice.name}`);
      } catch (error) {
        failed++;
        console.error(`❌ 样本生成失败: ${voice.name}`, error);
      }
    }

    console.log(`✅ ${locale} 语音样本生成完成: 成功 ${updated}, 失败 ${failed}`);

    return {
      success: failed === 0,
      message: failed === 0
        ? `生成完成`
        : `部分失败: 成功 ${updated}, 失败 ${failed}`,
      updated,
    };
  } catch (error) {
    console.error(`❌ 生成 ${locale} 语音样本失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 批量生成所有语音样本
 * 只生成 voice_sample_url 为空的语音
 */
export async function generateAllVoiceSamples(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🎤 开始批量生成所有语音样本...');

    // 获取所有没有样本的语音
    const voicesWithoutSample = await prisma.voices.findMany({
      where: {
        voice_sample_url: '',
      },
      select: {
        id: true,
        name: true,
        locale: true,
      },
    });

    if (voicesWithoutSample.length === 0) {
      return {
        success: true,
        message: '所有语音已有样本，无需生成',
        updated: 0,
      };
    }

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const voice of voicesWithoutSample) {
      try {
        const sampleText = getSampleText(voice.locale);

        // 如果没有配置该语言的示例文本，跳过
        if (!sampleText) {
          skipped++;
          console.log(`⏭️ 跳过（无示例文本）: ${voice.name}`);
          continue;
        }

        console.log(`🎙️ 生成样本: ${voice.name}`);

        // 调用 Azure TTS 生成音频
        const ttsResult = await synthesizeSpeech({
          text: sampleText,
          voiceName: voice.name,
          language: voice.locale,
        });

        // 上传到 R2
        const fileName = `${voice.name}.mp3`;
        const audioUrl = await uploadAudio(
          ttsResult.audioData,
          fileName,
          'audio/mpeg',
          'voice-samples'
        );

        // 更新数据库
        await prisma.voices.update({
          where: { id: voice.id },
          data: {
            voice_sample_url: audioUrl,
            voice_sample_text: sampleText,
          },
        });

        updated++;
        console.log(`✅ 样本生成成功: ${voice.name}`);
      } catch (error) {
        failed++;
        console.error(`❌ 样本生成失败: ${voice.name}`, error);
      }
    }

    console.log(`✅ 批量语音样本生成完成: 成功 ${updated}, 失败 ${failed}, 跳过 ${skipped}`);

    return {
      success: failed === 0,
      message: failed === 0
        ? `生成完成`
        : `部分失败: 成功 ${updated}, 失败 ${failed}`,
      updated,
    };
  } catch (error) {
    console.error('❌ 批量生成语音样本失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 更新所有已存在的语音数据
 * 从 Azure API 获取最新数据，更新以下字段：
 * - gender: 转小写
 * - role: 默认为 Professional
 * - country: zh 开头的取第二段
 * - style_list: 从 Azure 获取
 * - display_name: 使用 Azure 的 LocalName
 *
 * 不更新的字段：is_active、avatar_url、voice_sample_url、voice_sample_text
 */
export async function updateAllVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始更新所有语音数据...');

    // 从 Azure API 获取所有语音
    const azureVoices = await fetchVoicesFromAzure();

    // 构建 Azure 语音映射（ShortName -> AzureVoice）
    const azureVoiceMap = new Map<string, AzureVoice>();
    for (const voice of azureVoices) {
      azureVoiceMap.set(voice.ShortName, voice);
    }

    // 获取数据库中所有语音
    const dbVoices = await prisma.voices.findMany({
      select: {
        id: true,
        name: true,
        locale: true,
      },
    });

    if (dbVoices.length === 0) {
      return {
        success: true,
        message: '数据库中没有语音',
        updated: 0,
      };
    }

    let updated = 0;
    let skipped = 0;

    for (const dbVoice of dbVoices) {
      const azureVoice = azureVoiceMap.get(dbVoice.name);

      if (!azureVoice) {
        // Azure 中没有这个语音，跳过
        skipped++;
        console.log(`⏭️ 跳过（Azure 中不存在）: ${dbVoice.name}`);
        continue;
      }

      // 更新字段
      await prisma.voices.update({
        where: { id: dbVoice.id },
        data: {
          gender: azureVoice.Gender.toLowerCase(),
          role: 'Professional', // 默认为 Professional
          country: getCountryFromLocale(azureVoice.Locale),
          style_list: azureVoice.StyleList && azureVoice.StyleList.length > 0
            ? (azureVoice.StyleList.includes('default') ? azureVoice.StyleList : ['default', ...azureVoice.StyleList])
            : ['default'],
          display_name: azureVoice.LocalName, // 使用 LocalName 作为 display_name
          locale: azureVoice.Locale, // 同步更新 locale
          provider: 'microsoft',
        },
      });

      updated++;
    }

    console.log(`✅ 语音数据更新完成: 更新 ${updated}, 跳过 ${skipped}`);

    return {
      success: true,
      message: `更新完成: 更新 ${updated}, 跳过 ${skipped}`,
      updated,
      skipped,
    };
  } catch (error) {
    console.error('❌ 更新语音数据失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}