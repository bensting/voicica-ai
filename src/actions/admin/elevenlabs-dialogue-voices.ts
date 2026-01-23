'use server';

/**
 * ElevenLabs Dialogue 语音同步 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * 同步结果
 */
interface SyncResult {
  success: boolean;
  message: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
}

/**
 * ElevenLabs Dialogue 可用的声音列表
 * 这些是 kie.ai text-to-dialogue-v3 API 支持的声音
 */
const ELEVENLABS_DIALOGUE_VOICES = [
  { id: 'Adam', name: 'Adam', gender: 'male' },
  { id: 'Alice', name: 'Alice', gender: 'female' },
  { id: 'Bill', name: 'Bill', gender: 'male' },
  { id: 'Brian', name: 'Brian', gender: 'male' },
  { id: 'Callum', name: 'Callum', gender: 'male' },
  { id: 'Charlie', name: 'Charlie', gender: 'male' },
  { id: 'Chris', name: 'Chris', gender: 'male' },
  { id: 'Daniel', name: 'Daniel', gender: 'male' },
  { id: 'Eric', name: 'Eric', gender: 'male' },
  { id: 'George', name: 'George', gender: 'male' },
  { id: 'Harry', name: 'Harry', gender: 'male' },
  { id: 'Jessica', name: 'Jessica', gender: 'female' },
  { id: 'Laura', name: 'Laura', gender: 'female' },
  { id: 'Liam', name: 'Liam', gender: 'male' },
  { id: 'Lily', name: 'Lily', gender: 'female' },
  { id: 'Matilda', name: 'Matilda', gender: 'female' },
  { id: 'River', name: 'River', gender: 'male' },
  { id: 'Roger', name: 'Roger', gender: 'male' },
  { id: 'Sarah', name: 'Sarah', gender: 'female' },
  { id: 'Will', name: 'Will', gender: 'male' },
];

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
    total: ELEVENLABS_DIALOGUE_VOICES.length,
    dbCount,
    activeCount,
  };
}

/**
 * 同步 ElevenLabs Dialogue 声音到数据库
 */
export async function syncElevenlabsDialogueVoices(): Promise<SyncResult> {
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始同步 ElevenLabs Dialogue 声音...');

    // 获取已存在的声音
    const existingVoices = await prisma.voices.findMany({
      where: { provider: 'elevenlabs_dialogue' },
      select: { name: true },
    });
    const existingNames = new Set(existingVoices.map((v) => v.name));

    let inserted = 0;
    let skipped = 0;

    for (const voice of ELEVENLABS_DIALOGUE_VOICES) {
      const voiceName = `elevenlabs_dialogue:${voice.id}`;

      if (existingNames.has(voiceName)) {
        skipped++;
        continue;
      }

      // 使用 DiceBear 生成头像
      const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(voice.id)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

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
          voice_sample_url: {},
          voice_sample_text: '',
          tags: ['dialogue', 'elevenlabs'],
          style_list: ['default'],
          is_active: true,
          sort_order: 0,
        },
      });

      inserted++;
      console.log(`✅ 同步成功: ${voice.name}`);
    }

    console.log(`✅ 同步完成: 插入 ${inserted} 条，跳过 ${skipped} 条`);

    return {
      success: true,
      message: `同步完成: 插入 ${inserted} 条，跳过 ${skipped} 条`,
      inserted,
      skipped,
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
    },
    orderBy: [{ sort_order: 'asc' }, { display_name: 'asc' }],
  });

  return voices.map((v) => ({
    id: v.name.replace('elevenlabs_dialogue:', ''), // 返回原始 voice ID (如 'Adam')
    name: v.name,
    display_name: v.display_name || '',
    gender: v.gender,
    avatar_url: v.avatar_url,
  }));
}
