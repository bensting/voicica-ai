'use server';

/**
 * ElevenLabs Dialogue 语音同步 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { DIALOGUE_ALL_VOICES, getVoiceSampleUrl } from '@/config/native/dialogueConfig';

/**
 * 同步结果
 */
interface SyncResult {
  success: boolean;
  message: string;
  inserted?: number;
  updated?: number;
}

/**
 * 获取 ElevenLabs Dialogue 声音统计
 */
export async function getElevenlabsDialogueStats(): Promise<{
  total: number;
  dbCount: number;
  activeCount: number;
}> {
  await verifyAdminWithoutDb();

  const dbCount = await prisma.voices.count({
    where: { provider: 'elevenlabs_dialogue' },
  });

  const activeCount = await prisma.voices.count({
    where: { provider: 'elevenlabs_dialogue', is_active: true },
  });

  return {
    total: DIALOGUE_ALL_VOICES.length,
    dbCount,
    activeCount,
  };
}

/**
 * 同步 ElevenLabs Dialogue 声音到数据库
 * 存在的更新，不存在的新增
 */
export async function syncElevenlabsDialogueVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始同步 ElevenLabs Dialogue 声音...');

    // 获取已存在的声音
    const existingVoices = await prisma.voices.findMany({
      where: { provider: 'elevenlabs_dialogue' },
      select: { id: true, name: true },
    });
    const existingMap = new Map(existingVoices.map((v) => [v.name, v.id]));

    let inserted = 0;
    let updated = 0;

    for (const voice of DIALOGUE_ALL_VOICES) {
      const voiceName = `elevenlabs_dialogue:${voice.id}`;

      // 使用 DiceBear 生成头像
      const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(voice.id)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

      // 样例声音地址（使用配置文件中的函数）
      const voiceSampleUrl = {
        default: getVoiceSampleUrl(voice.id),
      };

      if (existingMap.has(voiceName)) {
        // 更新已存在的声音
        await prisma.voices.update({
          where: { id: existingMap.get(voiceName) },
          data: {
            display_name: voice.name,
            gender: voice.gender,
            avatar_url: avatarUrl,
            voice_sample_url: voiceSampleUrl,
            tags: ['dialogue', 'elevenlabs'],
          },
        });
        updated++;
        console.log(`🔄 更新: ${voice.name}`);
      } else {
        // 新增声音
        await prisma.voices.create({
          data: {
            name: voiceName,
            display_name: voice.name,
            provider: 'elevenlabs_dialogue',
            locale: 'en-US',
            country: 'US',
            role: 'standard',
            gender: voice.gender,
            avatar_url: avatarUrl,
            voice_sample_url: voiceSampleUrl,
            voice_sample_text: '',
            tags: ['dialogue', 'elevenlabs'],
            style_list: ['default'],
            is_active: true,
            sort_order: 0,
          },
        });
        inserted++;
        console.log(`✅ 新增: ${voice.name}`);
      }
    }

    console.log(`✅ 同步完成: 新增 ${inserted} 条，更新 ${updated} 条`);

    return {
      success: true,
      message: `同步完成: 新增 ${inserted} 条，更新 ${updated} 条`,
      inserted,
      updated,
    };
  } catch (error) {
    console.error('同步 ElevenLabs Dialogue 声音失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 获取 ElevenLabs Dialogue 声音列表（用于前端选择）
 */
export async function getElevenlabsDialogueVoices(): Promise<
  Array<{
    id: string;
    name: string;
    display_name: string;
    gender: string;
    avatar_url: string;
    voice_sample_url: Record<string, string>;
  }>
> {
  const voices = await prisma.voices.findMany({
    where: {
      provider: 'elevenlabs_dialogue',
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      display_name: true,
      gender: true,
      avatar_url: true,
      voice_sample_url: true,
    },
    orderBy: [{ sort_order: 'asc' }, { display_name: 'asc' }],
  });

  return voices.map((v) => ({
    id: v.name.replace('elevenlabs_dialogue:', ''), // 返回原始 voice ID (如 'Adam')
    name: v.name,
    display_name: v.display_name || '',
    gender: v.gender,
    avatar_url: v.avatar_url,
    voice_sample_url: (v.voice_sample_url as Record<string, string>) || {},
  }));
}
