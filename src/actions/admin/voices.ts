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

/**
 * 各语言的示例文本（讲故事风格，展示语音表现力）
 */
const SAMPLE_TEXTS: Record<string, string> = {
  // 中文
  'zh-CN': '在一个阳光明媚的早晨，小猫咪伸了个懒腰，打了个哈欠说："今天又是美好的一天呀！"',
  'zh-TW': '在一個陽光明媚的早晨，小貓咪伸了個懶腰，打了個哈欠說：「今天又是美好的一天呀！」',
  'zh-HK': '喺一個陽光燦爛嘅朝早，小貓咪伸咗個懶腰，打咗個喊露話：「今日又係美好嘅一日呀！」',

  // 英语
  'en-US': 'Once upon a time, in a land far away, there lived a curious little fox who loved to explore. "What an amazing adventure!" she exclaimed with joy.',
  'en-GB': 'Once upon a time, in a land far away, there lived a curious little fox who loved to explore. "What an amazing adventure!" she exclaimed with joy.',
  'en-AU': 'Once upon a time, in a land far away, there lived a curious little fox who loved to explore. "What an amazing adventure!" she exclaimed with joy.',
  'en-IN': 'Once upon a time, in a land far away, there lived a curious little fox who loved to explore. "What an amazing adventure!" she exclaimed with joy.',

  // 日语
  'ja-JP': 'ある晴れた朝、子猫がのびをして言いました。「今日も楽しい一日になりそう！わくわくするね！」',

  // 韩语
  'ko-KR': '어느 화창한 아침, 아기 고양이가 기지개를 켜며 말했어요. "오늘도 정말 신나는 하루가 될 것 같아!"',

  // 法语
  'fr-FR': 'Par une belle matinée ensoleillée, le petit chat s\'étira et dit avec enthousiasme : « Quelle merveilleuse journée nous attend ! »',
  'fr-CA': 'Par une belle matinée ensoleillée, le petit chat s\'étira et dit avec enthousiasme : « Quelle merveilleuse journée nous attend ! »',

  // 西班牙语
  'es-ES': 'En una hermosa mañana soleada, el gatito se estiró y exclamó con alegría: "¡Qué día tan maravilloso nos espera!"',
  'es-MX': 'En una hermosa mañana soleada, el gatito se estiró y exclamó con alegría: "¡Qué día tan maravilloso nos espera!"',

  // 德语
  'de-DE': 'An einem wunderschönen Morgen streckte sich das Kätzchen und rief fröhlich: „Was für ein wundervoller Tag wird das heute!"',
  'de-AT': 'An einem wunderschönen Morgen streckte sich das Kätzchen und rief fröhlich: „Was für ein wundervoller Tag wird das heute!"',

  // 意大利语
  'it-IT': 'In una bella mattina di sole, il gattino si stiracchiò e disse con gioia: "Che giornata meravigliosa ci aspetta!"',

  // 葡萄牙语
  'pt-BR': 'Numa bela manhã ensolarada, o gatinho se espreguiçou e disse com alegria: "Que dia maravilhoso nos espera!"',
  'pt-PT': 'Numa bela manhã ensolarada, o gatinho espreguiçou-se e disse com alegria: «Que dia maravilhoso nos espera!»',

  // 俄语
  'ru-RU': 'Однажды солнечным утром котёнок потянулся и радостно сказал: «Какой чудесный день нас ждёт!»',

  // 阿拉伯语
  'ar-SA': 'في صباح مشمس جميل، تمطى القط الصغير وقال بفرح: "يا له من يوم رائع ينتظرنا!"',

  // 印地语
  'hi-IN': 'एक खूबसूरत धूप भरी सुबह, छोटी बिल्ली ने अंगड़ाई ली और खुशी से कहा: "आज का दिन कितना शानदार होने वाला है!"',

  // 泰语
  'th-TH': 'ในเช้าวันที่แดดสดใส ลูกแมวยืดตัวและพูดอย่างมีความสุขว่า "วันนี้จะเป็นวันที่วิเศษมากเลย!"',

  // 越南语
  'vi-VN': 'Vào một buổi sáng đầy nắng, chú mèo con vươn vai và nói với niềm vui: "Hôm nay sẽ là một ngày tuyệt vời!"',

  // 印尼语
  'id-ID': 'Di pagi yang cerah, anak kucing meregangkan badannya dan berkata dengan gembira: "Hari ini pasti akan menjadi hari yang indah!"',

  // 马来语
  'ms-MY': 'Pada suatu pagi yang cerah, anak kucing meregangkan badannya dan berkata dengan gembira: "Hari ini pasti akan menjadi hari yang indah!"',

  // 荷兰语
  'nl-NL': 'Op een mooie zonnige ochtend rekte het katje zich uit en zei vrolijk: "Wat een prachtige dag staat ons te wachten!"',

  // 波兰语
  'pl-PL': 'Pewnego słonecznego poranka kotek przeciągnął się i powiedział radośnie: „Co za wspaniały dzień nas czeka!"',

  // 土耳其语
  'tr-TR': 'Güneşli bir sabah, yavru kedi gerinip neşeyle söyledi: "Bugün ne harika bir gün olacak!"',

  // 瑞典语
  'sv-SE': 'En vacker solig morgon sträckte sig kattungen och sa glatt: "Vilken underbar dag som väntar oss!"',

  // 挪威语
  'nb-NO': 'En vakker solrik morgen strakte kattungen seg og sa glad: "For en fantastisk dag som venter oss!"',

  // 丹麦语
  'da-DK': 'En smuk solrig morgen strakte killingen sig og sagde glad: "Sikke en vidunderlig dag der venter os!"',

  // 芬兰语
  'fi-FI': 'Kauniina aurinkoisena aamuna kissanpentu venytteli ja sanoi iloisesti: "Mikä ihana päivä meitä odottaa!"',

  // 捷克语
  'cs-CZ': 'Jednoho krásného slunečného rána se koťátko protáhlo a radostně řeklo: „Jaký nádherný den nás čeká!"',

  // 希腊语
  'el-GR': 'Ένα όμορφο ηλιόλουστο πρωί, το γατάκι τεντώθηκε και είπε χαρούμενα: «Τι υπέροχη μέρα μας περιμένει!»',

  // 希伯来语
  'he-IL': 'בבוקר שמשי יפה, החתלתול התמתח ואמר בשמחה: "איזה יום נפלא מחכה לנו!"',

  // 乌克兰语
  'uk-UA': 'Одного сонячного ранку кошеня потягнулося і радісно сказало: «Який чудовий день на нас чекає!»',

  // 罗马尼亚语
  'ro-RO': 'Într-o dimineață frumoasă și însorită, pisicuța s-a întins și a spus cu bucurie: „Ce zi minunată ne așteaptă!"',

  // 匈牙利语
  'hu-HU': 'Egy szép napos reggelen a kiscica nyújtózkodott és boldogan mondta: „Micsoda csodálatos nap vár ránk!"',

  // 默认（英语）
  'default': 'Once upon a time, on a beautiful sunny morning, a little kitten stretched and said happily: "What a wonderful day awaits us!"',
};

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
 * 语系 fallback 映射
 * 当精确 locale 没有配置时，使用同语系的默认文本
 */
const LANG_FALLBACKS: Record<string, string> = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'pt': 'pt-BR',
  'ar': 'ar-SA',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'it': 'it-IT',
  'ru': 'ru-RU',
  'hi': 'hi-IN',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'id': 'id-ID',
  'ms': 'ms-MY',
  'nl': 'nl-NL',
  'pl': 'pl-PL',
  'tr': 'tr-TR',
  'sv': 'sv-SE',
  'nb': 'nb-NO',
  'da': 'da-DK',
  'fi': 'fi-FI',
  'cs': 'cs-CZ',
  'el': 'el-GR',
  'he': 'he-IL',
  'uk': 'uk-UA',
  'ro': 'ro-RO',
  'hu': 'hu-HU',
};

/**
 * 获取语言对应的示例文本
 * 如果没有配置，返回 null 表示不支持
 */
function getSampleText(locale: string): string | null {
  // 精确匹配
  if (SAMPLE_TEXTS[locale]) {
    return SAMPLE_TEXTS[locale];
  }

  // 语系匹配：zh-XX 用 zh-CN，en-XX 用 en-US 等
  const lang = locale.split('-')[0];
  const fallbackLocale = LANG_FALLBACKS[lang];

  if (fallbackLocale && SAMPLE_TEXTS[fallbackLocale]) {
    return SAMPLE_TEXTS[fallbackLocale];
  }

  // 没有配置的语言返回 null，跳过生成
  return null;
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