/**
 * TTS 任务处理函数 (Inngest)
 */
import { inngest } from '../client';
import prisma from '@/lib/prisma';
import { synthesizeSpeech } from '@/lib/services/azure-tts';
import { uploadAudio } from '@/lib/services/r2-storage';

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
      speed,
      pitch,
      volume,
      creditsCost,
      isAnonymous,
    } = event.data;

    console.log(`🚀 [Inngest] 开始处理 TTS 任务: ${taskId}`);

    let creditsDeducted = false;

    try {
      // Step 1: 获取任务记录并更新状态为处理中
      const record = await step.run('get-record', async () => {
        const ttsRecord = await prisma.tts_records.findUnique({
          where: { task_id: taskId },
        });

        if (!ttsRecord) {
          throw new Error(`任务记录不存在: ${taskId}`);
        }

        // 更新状态为处理中
        await prisma.tts_records.update({
          where: { id: ttsRecord.id },
          data: {
            status: 'PROCESSING',
            progress: 10,
            character_count: text.length,
          },
        });

        return { id: ttsRecord.id };
      });

      // Step 2: 扣减积分
      await step.run('deduct-credits', async () => {
        if (isAnonymous) {
          const result = await prisma.anonymous_users.updateMany({
            where: {
              user_id: userId,
              credits: { gte: creditsCost },
            },
            data: {
              credits: { decrement: creditsCost },
            },
          });
          if (result.count === 0) {
            throw new Error('积分扣减失败，余额不足');
          }
        } else {
          const result = await prisma.users.updateMany({
            where: {
              user_id: userId,
              credits: { gte: creditsCost },
            },
            data: {
              credits: { decrement: creditsCost },
            },
          });
          if (result.count === 0) {
            throw new Error('积分扣减失败，余额不足');
          }
        }
        creditsDeducted = true;
        console.log(`💰 积分扣减成功: ${userId}, -${creditsCost}`);
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
        console.log(`🎤 调用 Azure TTS: ${voiceName}`);
        const result = await synthesizeSpeech({
          text,
          voiceName,
          language: language || voice.locale,
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

      // 如果积分已扣减，退还积分
      if (creditsDeducted) {
        try {
          if (isAnonymous) {
            await prisma.anonymous_users.update({
              where: { user_id: userId },
              data: {
                credits: { increment: creditsCost },
              },
            });
          } else {
            await prisma.users.update({
              where: { user_id: userId },
              data: {
                credits: { increment: creditsCost },
              },
            });
          }
          console.log(`💰 积分已退还: ${userId}, +${creditsCost}`);
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
