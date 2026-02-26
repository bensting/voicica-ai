/**
 * TTS 任务队列处理函数 (Cloudflare Queues)
 *
 * 由 Cloudflare Queue Consumer Worker 通过 Service Binding 调用
 * 支持 Azure、Google 和 Fish Audio TTS 服务
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ttsRecords, taskQueue, voices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { synthesizeSpeech as azureSynthesize } from '@/lib/services/azure-tts';
import { synthesizeSpeech as googleSynthesize } from '@/lib/services/google-tts';
import { synthesizeSpeech as fishAudioSynthesize } from '@/lib/services/fish-audio-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/productType';
import type { TtsQueuePayload } from '@/lib/queue/tts-queue';
import { deductCreditsAtomic, refundCredits, type DeductionBreakdown } from '@/lib/credits';

// 允许长时间运行（最多 5 分钟）
export const maxDuration = 300;

// 处理函数（不带签名验证，用于开发环境）
async function handleTTSTask(req: NextRequest) {
  const db = await getDb();
  const payload: TtsQueuePayload = await req.json();
  const { taskId, userId, text, voiceName, language, style, speed, pitch, volume, creditsCost, isAnonymous } = payload;

  console.log(`🚀 [Queue] 开始处理 TTS 任务: ${taskId}`);
  let deductionBreakdown: DeductionBreakdown | null = null;

  try {
    // 1. 幂等性检查：获取任务记录并验证状态
    const [ttsRecord] = await db.select().from(ttsRecords).where(eq(ttsRecords.taskId, taskId)).limit(1);

    if (!ttsRecord) {
      throw new Error(`任务记录不存在: ${taskId}`);
    }

    // 如果任务已被处理，跳过执行
    if (ttsRecord.status !== 'PENDING') {
      console.log(`⚠️ [Queue] 任务 ${taskId} 已被处理，状态: ${ttsRecord.status}，跳过执行`);
      return NextResponse.json({ success: true, skipped: true, reason: `Task already in status: ${ttsRecord.status}` });
    }

    // 2. 使用乐观锁更新状态为处理中（只有 PENDING 状态才能更新）
    const updateResult = await db.update(ttsRecords)
      .set({
        status: 'PROCESSING',
        progress: 10,
        characterCount: text.length,
      })
      .where(and(
        eq(ttsRecords.taskId, taskId),
        eq(ttsRecords.status, 'PENDING'),
      ))
      .returning();

    // 如果更新失败（返回空数组），说明状态已被其他实例修改
    if (updateResult.length === 0) {
      console.log(`⚠️ [Queue] 任务 ${taskId} 状态已被其他实例修改，跳过执行`);
      return NextResponse.json({ success: true, skipped: true, reason: 'Task status already modified' });
    }

    console.log(`🔓 [Queue] 任务 ${taskId} 状态已锁定为 PROCESSING`);

    // 3. 扣减积分并记录历史（使用原子性扣除避免竞态条件，返回扣减详情用于失败时精确返还）
    deductionBreakdown = await deductCreditsAtomic(
      userId,
      creditsCost,
      ProductType.TEXT_TO_SPEECH,
      isAnonymous,
      `TTS: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
      taskId
    );

    // 4. 更新进度到 20%
    await db.update(ttsRecords).set({ progress: 20 }).where(eq(ttsRecords.taskId, taskId));

    // 5. 获取语音信息
    const [voice] = await db.select().from(voices).where(eq(voices.name, voiceName)).limit(1);

    if (!voice) {
      throw new Error(`语音不存在: ${voiceName}`);
    }

    // 6. 更新进度到 30%
    await db.update(ttsRecords).set({ progress: 30 }).where(eq(ttsRecords.taskId, taskId));

    // 7. 根据 provider 调用对应的 TTS 服务
    const provider = voice.provider || 'microsoft';
    console.log(`🎤 调用 ${provider.toUpperCase()} TTS: ${voiceName}, style: ${style || 'default'}`);

    let audioData: Buffer;
    let duration: number;
    let format: string;

    if (provider === 'fish') {
      // Fish Audio TTS
      // voiceName 格式为 "locale:model_id"，如 "zh-CN:1512d05841734931bf905d0520c272b1"
      // 需要提取冒号后的 model_id 作为 reference_id
      //
      // Fish Audio prosody 参数转换：
      // - speed: 直接使用前端值（0.5 - 2.0），Fish Audio 默认 1.0
      // - volume: 前端 1-100 (默认50) -> Fish Audio 使用相对值，默认 0
      //           转换公式：(volume - 50) / 50，范围 -1 到 +1
      // - pitch: Fish Audio 不支持音调调节，忽略此参数
      //
      const fishModelId = voiceName.includes(':') ? voiceName.split(':')[1] : voiceName;
      console.log(`🐟 Fish Audio: voiceName=${voiceName}, modelId=${fishModelId}`);

      const fishProsody: { speed?: number; volume?: number } = {};

      // 语速：直接使用，Fish Audio 支持的范围与前端一致
      if (speed !== undefined && speed !== 1.0) {
        fishProsody.speed = speed;
      }

      // 音量：前端 50 为默认值对应 Fish Audio 的 0
      // 前端 1 -> -0.98, 前端 50 -> 0, 前端 100 -> +1
      if (volume !== undefined && volume !== 50) {
        fishProsody.volume = (volume - 50) / 50;
      }

      const result = await fishAudioSynthesize({
        text,
        reference_id: fishModelId,
        format: 'mp3',
        mp3_bitrate: 128,
        prosody: Object.keys(fishProsody).length > 0 ? fishProsody : undefined,
      });
      audioData = result.audioData;
      duration = result.duration;
      format = result.format;
    } else if (provider === 'google') {
      // Google TTS（不支持 style）
      const result = await googleSynthesize({
        text,
        voiceName,
        language: language || voice.locale,
        speed,
        pitch,
        volume,
      });
      audioData = result.audioData;
      duration = result.duration;
      format = result.format;
    } else {
      // Azure TTS（默认，支持 style）
      const result = await azureSynthesize({
        text,
        voiceName,
        language: language || voice.locale,
        style: style || undefined,
        speed,
        pitch,
        volume,
      });
      audioData = result.audioData;
      duration = result.duration;
      format = result.format;
    }

    // 8. 更新进度到 80%
    await db.update(ttsRecords).set({ progress: 80 }).where(eq(ttsRecords.taskId, taskId));

    // 9. 上传音频到 R2
    const fileName = `${taskId}.${format}`;
    const audioUrl = await uploadAudio(
      audioData,
      fileName,
      'audio/mpeg',
      `tts_audio/${userId}`
    );

    // 10. 更新任务状态为成功
    await db.update(ttsRecords)
      .set({
        status: 'SUCCESS',
        progress: 100,
        audioUrl: audioUrl,
        duration,
        format,
        completedAt: new Date().toISOString(),
      })
      .where(eq(ttsRecords.taskId, taskId));

    // 更新 task_queue 状态
    await db.update(taskQueue)
      .set({
        status: 'SUCCESS',
        completedAt: new Date().toISOString(),
      })
      .where(eq(taskQueue.taskId, taskId));

    console.log(`✅ [Queue] TTS 任务处理成功: ${taskId}`);

    return NextResponse.json({
      success: true,
      taskId,
      audioUrl,
      duration,
    });

  } catch (error) {
    console.error(`❌ [Queue] TTS 任务处理失败: ${taskId}`, error);

    // 如果积分已扣减，精确返还到原来的积分池
    if (deductionBreakdown) {
      try {
        await refundCredits(
          userId,
          deductionBreakdown,
          ProductType.TEXT_TO_SPEECH,
          isAnonymous,
          'TTS Task failed, refund credits',
          taskId
        );
      } catch (refundError) {
        console.error('积分退还失败:', refundError);
      }
    }

    // 更新任务状态为失败
    try {
      await db.update(ttsRecords)
        .set({
          status: 'FAILURE',
          progress: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        })
        .where(eq(ttsRecords.taskId, taskId));

      await db.update(taskQueue)
        .set({
          status: 'FAILURE',
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        })
        .where(eq(taskQueue.taskId, taskId));
    } catch (updateError) {
      console.error('更新失败状态异常:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process TTS task',
      },
      { status: 500 }
    );
  }
}

// 导出 POST 函数
// 生产环境：验证 X-Queue-Secret header（确保只有 Consumer Worker 可以调用）
// 开发环境：跳过验证（方便本地测试）
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const secret = req.headers.get('X-Queue-Secret');
    if (!secret || secret !== process.env.QUEUE_CONSUMER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  return handleTTSTask(req);
}
