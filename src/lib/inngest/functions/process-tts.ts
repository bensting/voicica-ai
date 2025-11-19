/**
 * TTS 任务处理函数 (Inngest)
 */
import { inngest } from '../client';
import { getDb } from '@/lib/db';
import { ttsRecords, taskQueue, users, anonymousUsers, voices } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
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
        const db = await getDb();
        const ttsRecord = await db.query.ttsRecords.findFirst({
          where: eq(ttsRecords.taskId, taskId),
        });

        if (!ttsRecord) {
          throw new Error(`任务记录不存在: ${taskId}`);
        }

        // 更新状态为处理中
        await db
          .update(ttsRecords)
          .set({
            status: 'PROCESSING',
            progress: 10,
            characterCount: text.length,
          })
          .where(eq(ttsRecords.id, ttsRecord.id));

        return { id: ttsRecord.id };
      });

      // Step 2: 扣减积分
      await step.run('deduct-credits', async () => {
        const db = await getDb();
        if (isAnonymous) {
          await db
            .update(anonymousUsers)
            .set({
              credits: sql`${anonymousUsers.credits} - ${creditsCost}`,
            })
            .where(
              and(
                eq(anonymousUsers.userId, userId),
                gte(anonymousUsers.credits, creditsCost)
              )
            );
          // D1 doesn't support rowCount easily, we'll check differently
          const user = await db.query.anonymousUsers.findFirst({
            where: eq(anonymousUsers.userId, userId),
          });
          if (!user || user.credits < 0) {
            throw new Error('积分扣减失败，余额不足');
          }
        } else {
          await db
            .update(users)
            .set({
              credits: sql`${users.credits} - ${creditsCost}`,
            })
            .where(
              and(
                eq(users.userId, userId),
                gte(users.credits, creditsCost)
              )
            );
          const user = await db.query.users.findFirst({
            where: eq(users.userId, userId),
          });
          if (!user || user.credits < 0) {
            throw new Error('积分扣减失败，余额不足');
          }
        }
        creditsDeducted = true;
        console.log(`💰 积分扣减成功: ${userId}, -${creditsCost}`);
      });

      // Step 3: 更新进度
      await step.run('update-progress-20', async () => {
        const db = await getDb();
        await db
          .update(ttsRecords)
          .set({ progress: 20 })
          .where(eq(ttsRecords.id, record.id));
      });

      // Step 4: 获取语音信息
      const voice = await step.run('get-voice', async () => {
        const db = await getDb();
        const voiceRecord = await db.query.voices.findFirst({
          where: eq(voices.name, voiceName),
        });
        if (!voiceRecord) {
          throw new Error(`语音不存在: ${voiceName}`);
        }
        return voiceRecord;
      });

      // Step 5: 更新进度
      await step.run('update-progress-30', async () => {
        const db = await getDb();
        await db
          .update(ttsRecords)
          .set({ progress: 30 })
          .where(eq(ttsRecords.id, record.id));
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
        const db = await getDb();
        await db
          .update(ttsRecords)
          .set({ progress: 80 })
          .where(eq(ttsRecords.id, record.id));
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
        const db = await getDb();
        await db
          .update(ttsRecords)
          .set({
            status: 'SUCCESS',
            progress: 100,
            audioUrl: audioUrl,
            duration: ttsResult.duration,
            format: ttsResult.format,
            completedAt: new Date(),
          })
          .where(eq(ttsRecords.id, record.id));

        // 更新 task_queue 状态
        await db
          .update(taskQueue)
          .set({
            status: 'SUCCESS',
            completedAt: new Date(),
          })
          .where(eq(taskQueue.taskId, taskId));
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
          const db = await getDb();
          if (isAnonymous) {
            await db
              .update(anonymousUsers)
              .set({
                credits: sql`${anonymousUsers.credits} + ${creditsCost}`,
              })
              .where(eq(anonymousUsers.userId, userId));
          } else {
            await db
              .update(users)
              .set({
                credits: sql`${users.credits} + ${creditsCost}`,
              })
              .where(eq(users.userId, userId));
          }
          console.log(`💰 积分已退还: ${userId}, +${creditsCost}`);
        } catch (refundError) {
          console.error('积分退还失败:', refundError);
        }
      }

      // 更新任务状态为失败
      try {
        const db = await getDb();
        await db
          .update(ttsRecords)
          .set({
            status: 'FAILURE',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          })
          .where(eq(ttsRecords.taskId, taskId));

        await db
          .update(taskQueue)
          .set({
            status: 'FAILURE',
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          })
          .where(eq(taskQueue.taskId, taskId));
      } catch (updateError) {
        console.error('更新失败状态异常:', updateError);
      }

      throw error;
    }
  }
);