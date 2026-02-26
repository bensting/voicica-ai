'use server';

/**
 * ElevenLabs Dialogue 语音同步 Server Actions
 */
import { getDb } from '@/lib/db';
import { voices } from '@/db/schema';
import { eq, and, count, asc } from 'drizzle-orm';
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
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [[{ total: dbCount }], [{ total: activeCount }]] = await Promise.all([
    db.select({ total: count() }).from(voices).where(eq(voices.provider, 'elevenlabs_dialogue')),
    db.select({ total: count() }).from(voices).where(and(eq(voices.provider, 'elevenlabs_dialogue'), eq(voices.isActive, true))),
  ]);

  return {
    total: DIALOGUE_ALL_VOICES.length,
    dbCount: Number(dbCount),
    activeCount: Number(activeCount),
  };
}

/**
 * 同步 ElevenLabs Dialogue 声音到数据库
 * 存在的更新，不存在的新增
 */
export async function syncElevenlabsDialogueVoices(): Promise<SyncResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始同步 ElevenLabs Dialogue 声音...');

    // 获取已存在的声音
    const existingVoices = await db.select({ id: voices.id, name: voices.name }).from(voices)
      .where(eq(voices.provider, 'elevenlabs_dialogue'));
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
        await db.update(voices).set({
          displayName: voice.name,
          gender: voice.gender,
          avatarUrl: avatarUrl,
          voiceSampleUrl: voiceSampleUrl,
          tags: ['dialogue', 'elevenlabs'],
        }).where(eq(voices.id, existingMap.get(voiceName)!));
        updated++;
        console.log(`🔄 更新: ${voice.name}`);
      } else {
        // 新增声音
        await db.insert(voices).values({
          name: voiceName,
          displayName: voice.name,
          provider: 'elevenlabs_dialogue',
          locale: 'en-US',
          country: 'US',
          role: 'standard',
          gender: voice.gender,
          avatarUrl: avatarUrl,
          voiceSampleUrl: voiceSampleUrl,
          voiceSampleText: '',
          tags: ['dialogue', 'elevenlabs'],
          styleList: ['default'],
          isActive: true,
          sortOrder: 0,
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
  const db = await getDb();
  const result = await db.select({
    id: voices.id,
    name: voices.name,
    displayName: voices.displayName,
    gender: voices.gender,
    avatarUrl: voices.avatarUrl,
    voiceSampleUrl: voices.voiceSampleUrl,
  }).from(voices)
    .where(and(eq(voices.provider, 'elevenlabs_dialogue'), eq(voices.isActive, true)))
    .orderBy(asc(voices.sortOrder), asc(voices.displayName));

  return result.map((v) => ({
    id: v.name.replace('elevenlabs_dialogue:', ''), // 返回原始 voice ID (如 'Adam')
    name: v.name,
    display_name: v.displayName || '',
    gender: v.gender,
    avatar_url: v.avatarUrl,
    voice_sample_url: (v.voiceSampleUrl as Record<string, string>) || {},
  }));
}
