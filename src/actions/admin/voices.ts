'use server';

/**
 * 语音管理 Server Actions
 * 从 Azure TTS API 获取语音列表，同步到数据库
 */
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getLocaleInfo } from '@/utils/localeMapper';
import { synthesizeSpeech } from '@/lib/services/azure-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { getSampleText } from '@/config/voiceSampleTexts';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

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
    // 检查 voice_sample_url JSON 中是否有 default 键
    const sampleStats = await prisma.voices.groupBy({
      by: ['locale'],
      where: {
        voice_sample_url: {
          path: ['default'],
          not: Prisma.DbNull,
        },
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
          voice_sample_url: {}, // JSON 格式 {style: url}，需要单独生成
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
 * 核心函数：为语音生成样本音频
 * 遍历每个语音的 style_list，为缺失样本的 style 生成音频
 * @param locale 可选，指定 locale 则只处理该 locale 的语音
 */
async function generateVoiceSamplesCore(locale?: string): Promise<SyncResult> {
  const label = locale || '全部';
  console.log(`🎤 开始生成 ${label} 的语音样本（支持多风格）...`);

  // 获取活跃语音，包含 style_list 和 voice_sample_url
  const voices = await prisma.voices.findMany({
    where: {
      is_active: true,
      ...(locale ? { locale } : {}),
    },
    select: {
      id: true,
      name: true,
      locale: true,
      style_list: true,
      voice_sample_url: true,
    },
  });

  if (voices.length === 0) {
    return {
      success: true,
      message: `${label} 没有找到活跃语音`,
      updated: 0,
    };
  }

  let generatedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const voice of voices) {
    const sampleText = getSampleText(voice.locale);

    // 如果没有配置该语言的示例文本，跳过整个语音
    if (!sampleText) {
      skippedCount++;
      continue;
    }

    const styleList = (voice.style_list as string[]) || ['default'];
    const existingSamples = (voice.voice_sample_url as Record<string, string> | null) || {};

    // 找出缺失样本的 styles
    const missingStyles = styleList.filter(style => !existingSamples[style]);

    if (missingStyles.length === 0) {
      // 该语音所有 style 都已有样本
      continue;
    }

    console.log(`🎙️ ${voice.name}: 需要生成 ${missingStyles.length} 个风格样本 [${missingStyles.join(', ')}]`);

    // 为每个缺失的 style 生成样本
    const newSamples: Record<string, string> = { ...existingSamples };

    for (const style of missingStyles) {
      try {
        console.log(`  🎤 生成 ${voice.name} - ${style}...`);

        // 调用 Azure TTS 生成音频（传入 style）
        const ttsResult = await synthesizeSpeech({
          text: sampleText,
          voiceName: voice.name,
          language: voice.locale,
          style: style === 'default' ? undefined : style,
        });

        // 上传到 R2，文件名包含 style
        const fileName = style === 'default'
          ? `${voice.name}.mp3`
          : `${voice.name}_${style}.mp3`;
        const audioUrl = await uploadAudio(
          ttsResult.audioData,
          fileName,
          'audio/mpeg',
          'voice-samples'
        );

        newSamples[style] = audioUrl;
        generatedCount++;
        console.log(`  ✅ ${voice.name} - ${style} 生成成功`);
      } catch (error) {
        failedCount++;
        console.error(`  ❌ ${voice.name} - ${style} 生成失败:`, error);
      }
    }

    // 更新数据库（合并新生成的样本）
    if (Object.keys(newSamples).length > Object.keys(existingSamples).length) {
      await prisma.voices.update({
        where: { id: voice.id },
        data: {
          voice_sample_url: newSamples,
          voice_sample_text: sampleText,
        },
      });
    }
  }

  console.log(`✅ ${label} 语音样本生成完成: 生成 ${generatedCount}, 失败 ${failedCount}, 跳过 ${skippedCount}`);

  return {
    success: failedCount === 0,
    message: failedCount === 0
      ? `生成完成: ${generatedCount} 个样本`
      : `部分失败: 成功 ${generatedCount}, 失败 ${failedCount}`,
    updated: generatedCount,
  };
}

/**
 * 为指定 locale 的语音生成样本音频
 */
export async function generateVoiceSamples(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    return await generateVoiceSamplesCore(locale);
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
 */
export async function generateAllVoiceSamples(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    return await generateVoiceSamplesCore();
  } catch (error) {
    console.error('❌ 批量生成语音样本失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 为单个语音生成样本音频（重新生成所有风格）
 * @param voiceId 语音 ID
 */
export async function generateVoiceSampleForVoice(voiceId: number): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    // 获取语音信息
    const voice = await prisma.voices.findUnique({
      where: { id: voiceId },
      select: {
        id: true,
        name: true,
        locale: true,
        style_list: true,
      },
    });

    if (!voice) {
      return {
        success: false,
        message: '语音不存在',
      };
    }

    const sampleText = getSampleText(voice.locale);
    if (!sampleText) {
      return {
        success: false,
        message: `没有配置 ${voice.locale} 的示例文本`,
      };
    }

    const styleList = (voice.style_list as string[]) || ['default'];
    console.log(`🎤 开始为 ${voice.name} 生成 ${styleList.length} 个风格的语音样本...`);

    let generatedCount = 0;
    let failedCount = 0;
    const newSamples: Record<string, string> = {};

    for (const style of styleList) {
      try {
        console.log(`  🎤 生成 ${voice.name} - ${style}...`);

        // 调用 Azure TTS 生成音频
        const ttsResult = await synthesizeSpeech({
          text: sampleText,
          voiceName: voice.name,
          language: voice.locale,
          style: style === 'default' ? undefined : style,
        });

        // 上传到 R2
        const fileName = style === 'default'
          ? `${voice.name}.mp3`
          : `${voice.name}_${style}.mp3`;
        const audioUrl = await uploadAudio(
          ttsResult.audioData,
          fileName,
          'audio/mpeg',
          'voice-samples'
        );

        newSamples[style] = audioUrl;
        generatedCount++;
        console.log(`  ✅ ${voice.name} - ${style} 生成成功`);
      } catch (error) {
        failedCount++;
        console.error(`  ❌ ${voice.name} - ${style} 生成失败:`, error);
      }
    }

    // 更新数据库
    if (generatedCount > 0) {
      await prisma.voices.update({
        where: { id: voice.id },
        data: {
          voice_sample_url: newSamples,
          voice_sample_text: sampleText,
        },
      });
    }

    console.log(`✅ ${voice.name} 语音样本生成完成: 成功 ${generatedCount}, 失败 ${failedCount}`);

    return {
      success: failedCount === 0,
      message: failedCount === 0
        ? `生成完成: ${generatedCount} 个样本`
        : `部分失败: 成功 ${generatedCount}, 失败 ${failedCount}`,
      updated: generatedCount,
    };
  } catch (error) {
    console.error(`❌ 生成语音样本失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 清空指定 locale 的语音样本
 */
export async function clearVoiceSamples(locale: string): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log(`🗑️ 开始清空 ${locale} 的语音样本...`);

    const result = await prisma.voices.updateMany({
      where: {
        locale,
      },
      data: {
        voice_sample_url: {},
        voice_sample_text: '',
      },
    });

    console.log(`✅ ${locale} 语音样本已清空: ${result.count} 个语音`);

    return {
      success: true,
      message: `已清空 ${result.count} 个语音的样本`,
      updated: result.count,
    };
  } catch (error) {
    console.error(`❌ 清空 ${locale} 语音样本失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '清空失败',
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
/**
 * 获取语音列表（管理员用，支持查看所有语音）
 */
export async function getAdminVoiceList(params: {
  page?: number;
  pageSize?: number;
  locale?: string;
  gender?: string;
  isActive?: boolean | null;
  search?: string;
  styleCountMin?: number;
  styleCountMax?: number;
}): Promise<{
  voices: Array<{
    id: number;
    name: string;
    display_name: string;
    locale: string;
    country: string;
    gender: string;
    role: string;
    is_active: boolean;
    avatar_url: string;
    style_list: string[];
    voice_sample_url: Record<string, string>;
    created_at: Date | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await verifyAdminWithoutDb();

  const { page = 1, pageSize = 20, locale, gender, isActive, search, styleCountMin, styleCountMax } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (locale) where.locale = locale;
  if (gender) where.gender = gender;
  if (isActive !== null && isActive !== undefined) where.is_active = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { display_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 如果有风格数量筛选，需要在内存中过滤
  const needsStyleFilter = styleCountMin !== undefined || styleCountMax !== undefined;

  if (needsStyleFilter) {
    // 获取所有符合基础条件的语音
    const allVoices = await prisma.voices.findMany({
      where,
      orderBy: [{ locale: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        display_name: true,
        locale: true,
        country: true,
        gender: true,
        role: true,
        is_active: true,
        avatar_url: true,
        style_list: true,
        voice_sample_url: true,
        created_at: true,
      },
    });

    // 在内存中按风格数量过滤
    const filteredVoices = allVoices.filter((v) => {
      const styleCount = ((v.style_list as string[]) || []).length;
      if (styleCountMin !== undefined && styleCount < styleCountMin) return false;
      if (styleCountMax !== undefined && styleCount > styleCountMax) return false;
      return true;
    });

    const total = filteredVoices.length;
    const paginatedVoices = filteredVoices.slice((page - 1) * pageSize, page * pageSize);

    return {
      voices: paginatedVoices.map((v) => ({
        ...v,
        display_name: v.display_name || v.name,
        style_list: (v.style_list as string[]) || [],
        voice_sample_url: (v.voice_sample_url as Record<string, string>) || {},
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 无风格数量筛选，使用数据库分页
  const [voices, total] = await Promise.all([
    prisma.voices.findMany({
      where,
      orderBy: [{ locale: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        display_name: true,
        locale: true,
        country: true,
        gender: true,
        role: true,
        is_active: true,
        avatar_url: true,
        style_list: true,
        voice_sample_url: true,
        created_at: true,
      },
    }),
    prisma.voices.count({ where }),
  ]);

  return {
    voices: voices.map((v) => ({
      ...v,
      display_name: v.display_name || v.name,
      style_list: (v.style_list as string[]) || [],
      voice_sample_url: (v.voice_sample_url as Record<string, string>) || {},
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 更新语音状态（启用/禁用）
 */
export async function updateVoiceStatus(
  voiceId: number,
  isActive: boolean
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    await prisma.voices.update({
      where: { id: voiceId },
      data: { is_active: isActive },
    });

    return {
      success: true,
      message: isActive ? '已启用' : '已禁用',
    };
  } catch (error) {
    console.error('更新语音状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 批量更新语音状态
 */
export async function batchUpdateVoiceStatus(
  voiceIds: number[],
  isActive: boolean
): Promise<{ success: boolean; message: string; updated: number }> {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.voices.updateMany({
      where: { id: { in: voiceIds } },
      data: { is_active: isActive },
    });

    return {
      success: true,
      message: `已${isActive ? '启用' : '禁用'} ${result.count} 个语音`,
      updated: result.count,
    };
  } catch (error) {
    console.error('批量更新语音状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
      updated: 0,
    };
  }
}

/**
 * 获取所有 locale 列表（用于筛选）
 */
export async function getAdminVoiceLocales(): Promise<Array<{ code: string; name: string }>> {
  await verifyAdminWithoutDb();

  const locales = await prisma.voices.findMany({
    select: { locale: true },
    distinct: ['locale'],
    orderBy: { locale: 'asc' },
  });

  // 动态导入 localeMapper
  const { getLocaleInfo } = await import('@/utils/localeMapper');

  return locales.map((l) => {
    const info = getLocaleInfo(l.locale);
    return {
      code: l.locale,
      name: info?.name || l.locale,
    };
  });
}

/**
 * 获取单个语音详情
 */
export async function getAdminVoiceById(voiceId: number): Promise<{
  id: number;
  name: string;
  display_name: string;
  locale: string;
  country: string;
  gender: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  style_list: string[];
  tags: string[];
  sort_order: number;
} | null> {
  await verifyAdminWithoutDb();

  const voice = await prisma.voices.findUnique({
    where: { id: voiceId },
  });

  if (!voice) return null;

  return {
    id: voice.id,
    name: voice.name,
    display_name: voice.display_name || voice.name,
    locale: voice.locale,
    country: voice.country,
    gender: voice.gender,
    role: voice.role,
    is_active: voice.is_active,
    avatar_url: voice.avatar_url,
    style_list: (voice.style_list as string[]) || [],
    tags: (voice.tags as string[]) || [],
    sort_order: voice.sort_order,
  };
}

/**
 * 更新语音信息
 */
export async function updateVoice(
  voiceId: number,
  data: {
    display_name?: string;
    role?: string;
    is_active?: boolean;
    style_list?: string[];
    tags?: string[];
    sort_order?: number;
  }
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    await prisma.voices.update({
      where: { id: voiceId },
      data: {
        ...(data.display_name !== undefined && { display_name: data.display_name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.style_list !== undefined && { style_list: data.style_list }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: '更新成功',
    };
  } catch (error) {
    console.error('更新语音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

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