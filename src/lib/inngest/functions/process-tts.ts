/**
 * TTS 任务处理函数 (Inngest)
 */
import { inngest } from '../client';
import prisma from '@/lib/prisma';
import { synthesizeSpeech } from '@/lib/services/azure-tts';
import { uploadAudio } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/credit';

export const processTtsTask = inngest.createFunction(
  {
    id: 'process-tts-task',
    retries: 3,
  },
  { event: 'tts/task.created' },
  async ({ event, step }) => {
    const {
      taskId,
      userId,
      text,
      voiceName,
      language,
      style,
      speed,
      pitch,
      volume,
      creditsCost,
      isAnonymous,
    } = event.data;

    console.log(`🚀 [Inngest] 开始处理 TTS 任务: ${taskId}`);

    let creditsDeducted = false;

    try {
      // Step 1: 获取任务记录并更新状态为处理中（幂等性保护）
      const record = await step.run('get-record', async () => {
        const ttsRecord = await prisma.tts_records.findUnique({
          where: { task_id: taskId },
        });

        if (!ttsRecord) {
          throw new Error(`任务记录不存在: ${taskId}`);
        }

        // 🔒 幂等性检查：如果任务已经在处理或已完成，跳过执行
        if (ttsRecord.status !== 'PENDING') {
          console.log(`⚠️ [Inngest] 任务 ${taskId} 已被处理，状态: ${ttsRecord.status}，跳过执行`);
          return { id: ttsRecord.id, alreadyProcessed: true as const, currentStatus: ttsRecord.status };
        }

        // 🔒 使用乐观锁更新状态为处理中（只有 PENDING 状态才能更新）
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
          console.log(`⚠️ [Inngest] 任务 ${taskId} 状态已被其他实例修改，跳过执行`);
          return { id: ttsRecord.id, alreadyProcessed: true as const, currentStatus: 'PROCESSING' };
        }

        console.log(`🔓 [Inngest] 任务 ${taskId} 状态已锁定为 PROCESSING`);
        return { id: ttsRecord.id, alreadyProcessed: false as const };
      });

      // 如果任务已被处理，直接返回
      if (record.alreadyProcessed) {
        console.log(`✅ [Inngest] 任务 ${taskId} 已被处理，幂等性保护生效`);
        return {
          success: true,
          taskId,
          skipped: true,
          reason: `Task already in status: ${record.currentStatus}`,
        };
      }

      // Step 2: 扣减积分并记录历史
      await step.run('deduct-credits', async () => {
        // 使用事务确保积分扣减和历史记录的原子性
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
      });

      // Step 3: 更新进度
      await step.run('update-progress-20', async () => {
        await prisma.tts_records.update({
          where: { id: record.id },
          data: { progress: 20 },
        });
      });

      // Step 4: 获取语音信息
      const voice = await step.run('get-voice', async () => {
        const voiceRecord = await prisma.voices.findFirst({
          where: { name: voiceName },
        });
        if (!voiceRecord) {
          throw new Error(`语音不存在: ${voiceName}`);
        }
        return voiceRecord;
      });

      // Step 5: 更新进度
      await step.run('update-progress-30', async () => {
        await prisma.tts_records.update({
          where: { id: record.id },
          data: { progress: 30 },
        });
      });

      // Step 6: 调用 Azure TTS 生成音频
      const ttsResult = await step.run('synthesize-speech', async () => {
        console.log(`🎤 调用 Azure TTS: ${voiceName}, style: ${style || 'default'}`);
        const result = await synthesizeSpeech({
          text,
          voiceName,
          language: language || voice.locale,
          style: style || undefined, // 语音风格
          speed,
          pitch,
          volume,
        });
        // 将 Buffer 转为 base64 以便序列化
        return {
          audioBase64: result.audioData.toString('base64'),
          duration: result.duration,
          format: result.format,
        };
      });

      // Step 7: 更新进度
      await step.run('update-progress-80', async () => {
        await prisma.tts_records.update({
          where: { id: record.id },
          data: { progress: 80 },
        });
      });

      // Step 8: 上传音频到 R2
      const audioUrl = await step.run('upload-audio', async () => {
        const fileName = `${taskId}.${ttsResult.format}`;
        // 从 base64 还原 Buffer
        const audioBuffer = Buffer.from(ttsResult.audioBase64, 'base64');
        return await uploadAudio(
          audioBuffer,
          fileName,
          'audio/mpeg',
          `tts_audio/${userId}`
        );
      });

      // Step 9: 更新任务状态为成功
      await step.run('mark-success', async () => {
        await prisma.tts_records.update({
          where: { id: record.id },
          data: {
            status: 'SUCCESS',
            progress: 100,
            audio_url: audioUrl,
            duration: ttsResult.duration,
            format: ttsResult.format,
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
      });

      console.log(`✅ [Inngest] TTS 任务处理成功: ${taskId}`);

      return {
        success: true,
        taskId,
        audioUrl,
        duration: ttsResult.duration,
      };

    } catch (error) {
      console.error(`❌ [Inngest] TTS 任务处理失败: ${taskId}`, error);

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

      throw error;
    }
  }
);
