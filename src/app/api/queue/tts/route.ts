 /**
 * TTS 任务队列处理函数 (Upstash QStash)
 *
 * 由 QStash 调用，处理异步 TTS 生成任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import prisma from '@/lib/prisma';
import { synthesizeSpeech } from '@/lib/services/azure-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/productType';
import type { TtsQueuePayload } from '@/lib/queue/tts-queue';

// 允许长时间运行（最多 5 分钟）
export const maxDuration = 300;

// 处理函数（不带签名验证，用于开发环境）
async function handleTTSTask(req: NextRequest) {
  const payload: TtsQueuePayload = await req.json();
  const { taskId, userId, text, voiceName, language, style, speed, pitch, volume, creditsCost, isAnonymous } = payload;

  console.log(`🚀 [Queue] 开始处理 TTS 任务: ${taskId}`);
  let creditsDeducted = false;

  try {
    // 1. 幂等性检查：获取任务记录并验证状态
    const ttsRecord = await prisma.tts_records.findUnique({
      where: { task_id: taskId },
    });

    if (!ttsRecord) {
      throw new Error(`任务记录不存在: ${taskId}`);
    }

    // 如果任务已被处理，跳过执行
    if (ttsRecord.status !== 'PENDING') {
      console.log(`⚠️ [Queue] 任务 ${taskId} 已被处理，状态: ${ttsRecord.status}，跳过执行`);
      return NextResponse.json({ success: true, skipped: true, reason: `Task already in status: ${ttsRecord.status}` });
    }

    // 2. 使用乐观锁更新状态为处理中（只有 PENDING 状态才能更新）
    const updateResult = await prisma.tts_records.updateMany({
      where: {
        task_id: taskId,
        status: 'PENDING', // 只有 PENDING 状态才能更新
      },
      data: {
        status: 'PROCESSING',
        progress: 10,
        character_count: text.length,
      },
    });

    // 如果更新失败（count = 0），说明状态已被其他实例修改
    if (updateResult.count === 0) {
      console.log(`⚠️ [Queue] 任务 ${taskId} 状态已被其他实例修改，跳过执行`);
      return NextResponse.json({ success: true, skipped: true, reason: 'Task status already modified' });
    }

    console.log(`🔓 [Queue] 任务 ${taskId} 状态已锁定为 PROCESSING`);

    // 3. 扣减积分并记录历史（使用事务确保原子性）
    await prisma.$transaction(async (tx) => {
      // 扣减积分
      if (isAnonymous) {
        const result = await tx.anonymous_users.updateMany({
          where: {
            user_id: userId,
            credits: { gte: creditsCost },
          },
          data: {
            credits: { decrement: creditsCost },
            total_credits_used: { increment: creditsCost },
          },
        });
        if (result.count === 0) {
          throw new Error('积分扣减失败，余额不足');
        }
      } else {
        const result = await tx.users.updateMany({
          where: {
            user_id: userId,
            credits: { gte: creditsCost },
          },
          data: {
            credits: { decrement: creditsCost },
            total_credits_used: { increment: creditsCost },
          },
        });
        if (result.count === 0) {
          throw new Error('积分扣减失败，余额不足');
        }
      }

      // 记录积分扣减历史
      await tx.credit_history.create({
        data: {
          user_id: userId,
          amount: -creditsCost, // 负数表示扣减
          task_id: taskId,
          description: `TTS生成: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
          product_type: ProductType.TEXT_TO_SPEECH,
        },
      });

      creditsDeducted = true;
      console.log(`💰 积分扣减成功: ${userId}, -${creditsCost}, 已记录到 credit_history`);
    });

    // 4. 更新进度到 20%
    await prisma.tts_records.update({
      where: { task_id: taskId },
      data: { progress: 20 },
    });

    // 5. 获取语音信息
    const voice = await prisma.voices.findFirst({
      where: { name: voiceName },
    });

    if (!voice) {
      throw new Error(`语音不存在: ${voiceName}`);
    }

    // 6. 更新进度到 30%
    await prisma.tts_records.update({
      where: { task_id: taskId },
      data: { progress: 30 },
    });

    // 7. 调用 Azure TTS 生成音频
    console.log(`🎤 调用 Azure TTS: ${voiceName}, style: ${style || 'default'}`);
    const { audioData, duration, format } = await synthesizeSpeech({
      text,
      voiceName,
      language: language || voice.locale,
      style: style || undefined,
      speed,
      pitch,
      volume,
    });

    // 8. 更新进度到 80%
    await prisma.tts_records.update({
      where: { task_id: taskId },
      data: { progress: 80 },
    });

    // 9. 上传音频到 R2
    const fileName = `${taskId}.${format}`;
    const audioUrl = await uploadAudio(
      audioData,
      fileName,
      'audio/mpeg',
      `tts_audio/${userId}`
    );

    // 10. 更新任务状态为成功
    await prisma.tts_records.update({
      where: { task_id: taskId },
      data: {
        status: 'SUCCESS',
        progress: 100,
        audio_url: audioUrl,
        duration,
        format,
        completed_at: new Date(),
      },
    });

    // 更新 task_queue 状态
    await prisma.task_queue.updateMany({
      where: { task_id: taskId },
      data: {
        status: 'SUCCESS',
        completed_at: new Date(),
      },
    });

    console.log(`✅ [Queue] TTS 任务处理成功: ${taskId}`);

    return NextResponse.json({
      success: true,
      taskId,
      audioUrl,
      duration,
    });

  } catch (error) {
    console.error(`❌ [Queue] TTS 任务处理失败: ${taskId}`, error);

    // 如果积分已扣减，退还积分并记录历史
    if (creditsDeducted) {
      try {
        await prisma.$transaction(async (tx) => {
          // 退还积分
          if (isAnonymous) {
            await tx.anonymous_users.update({
              where: { user_id: userId },
              data: {
                credits: { increment: creditsCost },
                total_credits_used: { decrement: creditsCost },
              },
            });
          } else {
            await tx.users.update({
              where: { user_id: userId },
              data: {
                credits: { increment: creditsCost },
                total_credits_used: { decrement: creditsCost },
              },
            });
          }

          // 记录积分退还历史
          await tx.credit_history.create({
            data: {
              user_id: userId,
              amount: creditsCost, // 正数表示退还
              task_id: taskId,
              description: `TTS任务失败，积分退还`,
              product_type: ProductType.TEXT_TO_SPEECH,
            },
          });

          console.log(`💰 积分已退还: ${userId}, +${creditsCost}, 已记录到 credit_history`);
        });
      } catch (refundError) {
        console.error('积分退还失败:', refundError);
      }
    }

    // 更新任务状态为失败
    try {
      await prisma.tts_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          progress: 0,
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date(),
        },
      });

      await prisma.task_queue.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date(),
        },
      });
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
// 生产环境：使用 QStash 签名验证（确保只有 QStash 可以调用）
// 开发环境：跳过验证（方便本地测试）
export const POST =
  process.env.NODE_ENV === 'production' && process.env.QSTASH_CURRENT_SIGNING_KEY
    ? verifySignatureAppRouter(handleTTSTask)
    : handleTTSTask;