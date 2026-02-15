'use server';

/**
 * Dialogue 生成 Server Actions
 * 使用 kie.ai 的 elevenlabs/text-to-dialogue-v3 API
 */
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import db from '@/lib/db';
import { dialogueRecords } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateDialogueCost } from '@/config/creditsCost';
import { checkCredits, deductCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { v4 as uuidv4 } from 'uuid';
import { uploadAudio } from '@/lib/services/r2-storage';

/**
 * Dialogue 请求参数
 */
interface DialogueRequest {
  dialogue: Array<{
    text: string;
    voice: string; // voice ID like 'Adam', 'Brian', etc.
  }>;
  stability?: number; // 0-1, default 0.5
  language_code?: string; // 语言代码，如 'en', 'zh', 'auto' 等
}

/**
 * 任务状态
 */
interface DialogueTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  audioUrl?: string;
  error?: string;
}

/**
 * 获取 kie.ai API Token
 */
function getKieApiToken(): string {
  const token = process.env.KIE_API_KEY;
  if (!token) {
    throw new Error('KIE_API_KEY environment variable not configured');
  }
  return token;
}

/**
 * 下载音频并上传到 R2
 */
async function downloadAndUploadToR2(
  url: string,
  taskId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载 Dialogue 音频: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `dialogue_${taskId}.mp3`;
    const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'dialogue_audio');
    console.log(`✅ [R2 Upload] Dialogue 音频上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

/**
 * 获取回调 URL
 */
function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    console.warn('未配置 NEXT_PUBLIC_APP_URL，回调功能可能不工作');
    return '';
  }
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return `${url}/api/webhooks/kie-dialogue`;
}

/**
 * 创建 Dialogue 生成任务
 */
export async function createDialogueTask(
  request: DialogueRequest
): Promise<DialogueTaskStatus> {
  const { user_id: userId, is_anonymous: isAnonymous } = await getUserOrAnonymous();

  // 计算总字符数
  const totalCharacters = request.dialogue.reduce(
    (sum, d) => sum + d.text.length,
    0
  );

  if (totalCharacters === 0) {
    throw new Error('Dialogue content cannot be empty');
  }

  if (totalCharacters > 5000) {
    throw new Error('Total characters cannot exceed 5000');
  }

  // 计算消耗的积分
  const creditsRequired = calculateDialogueCost(totalCharacters);

  // 检查用户积分
  const { hasEnough, current } = await checkCredits(userId, creditsRequired, isAnonymous);
  if (!hasEnough) {
    throw new Error(`Insufficient credits. Required: ${creditsRequired}, Current: ${current}`);
  }

  const token = getKieApiToken();
  const taskId = uuidv4();
  const callbackUrl = getCallbackUrl();

  // 创建数据库记录
  await db.insert(dialogueRecords).values({
    userId,
    taskId,
    dialogueJson: JSON.stringify(request.dialogue),
    totalCharacters,
    creditsCost: creditsRequired,
    status: 'PENDING',
    progress: 0,
  });

  // 调用 kie.ai API
  const inputParams: Record<string, unknown> = {
    dialogue: request.dialogue,
    stability: request.stability ?? 0.5,
  };

  // 只有当指定了具体语言代码时才传递（不传时 API 会自动检测）
  if (request.language_code && request.language_code !== 'auto') {
    inputParams.language_code = request.language_code;
  }

  const apiBody: Record<string, unknown> = {
    model: 'elevenlabs/text-to-dialogue-v3',
    input: inputParams,
  };

  // 添加回调 URL（如果有）
  if (callbackUrl) {
    apiBody.callBackUrl = callbackUrl;
  }

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('kie.ai API error:', response.status, errorText);

    // 更新记录状态为失败
    await db.update(dialogueRecords)
      .set({
        status: 'FAILURE',
        errorMessage: `API request failed: ${response.status}`,
      })
      .where(eq(dialogueRecords.taskId, taskId));

    if (response.status === 401) {
      throw new Error('API authentication failed');
    }
    if (response.status === 402) {
      throw new Error('API credits insufficient');
    }
    if (response.status === 422) {
      throw new Error('Invalid request parameters');
    }

    throw new Error(`API request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.code !== 200) {
    await db.update(dialogueRecords)
      .set({
        status: 'FAILURE',
        errorMessage: result.msg || 'API returned error',
      })
      .where(eq(dialogueRecords.taskId, taskId));
    throw new Error(result.msg || 'API returned error');
  }

  const externalTaskId = result.data.taskId;

  // 更新记录，保存外部任务 ID
  await db.update(dialogueRecords)
    .set({
      externalTaskId,
      status: 'PROCESSING',
      progress: 10,
    })
    .where(eq(dialogueRecords.taskId, taskId));

  // 扣除积分并记录历史
  await deductCredits(userId, creditsRequired, ProductType.DIALOGUE, isAnonymous, `Dialogue generation (${totalCharacters} chars)`, taskId);

  return {
    task_id: taskId,
    status: 'PROCESSING',
    progress: 10,
  };
}

/**
 * 获取 Dialogue 任务状态
 */
export async function getDialogueTaskStatus(
  taskId: string
): Promise<DialogueTaskStatus> {
  await getUserOrAnonymous();

  // 先从数据库获取记录
  const [record] = await db.select().from(dialogueRecords)
    .where(eq(dialogueRecords.taskId, taskId))
    .limit(1);

  if (!record) {
    throw new Error('Task not found');
  }

  // 如果已完成或失败，直接返回数据库状态
  if (record.status === 'SUCCESS' || record.status === 'FAILURE') {
    return {
      task_id: taskId,
      status: record.status as DialogueTaskStatus['status'],
      progress: record.progress,
      audioUrl: record.audioUrl || undefined,
      error: record.errorMessage || undefined,
    };
  }

  // 如果还在处理中，查询 kie.ai API 获取最新状态
  if (record.externalTaskId) {
    const token = getKieApiToken();

    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(record.externalTaskId)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.code === 200 && result.data) {
          const taskState = (result.data.state || '').toLowerCase();

          // 解析 resultJson 获取音频 URL
          let audioUrl: string | undefined;
          if (result.data.resultJson) {
            try {
              const resultData = JSON.parse(result.data.resultJson);
              audioUrl = resultData.resultUrls?.[0] || resultData.audio_url;
            } catch {
              // ignore
            }
          }

          if (taskState === 'success' && audioUrl) {
            // 下载并上传到 R2（与 webhook 保持一致）
            const r2Url = await downloadAndUploadToR2(audioUrl, taskId);
            const finalAudioUrl = r2Url || audioUrl; // 如果 R2 上传失败，使用原始 URL

            // 更新数据库
            await db.update(dialogueRecords)
              .set({
                status: 'SUCCESS',
                progress: 100,
                audioUrl: finalAudioUrl,
                completedAt: new Date().toISOString(),
              })
              .where(eq(dialogueRecords.id, record.id));

            return {
              task_id: taskId,
              status: 'SUCCESS',
              progress: 100,
              audioUrl: finalAudioUrl,
            };
          } else if (taskState === 'fail') {
            const errorMsg = result.data.failMsg || 'Generation failed';
            await db.update(dialogueRecords)
              .set({
                status: 'FAILURE',
                errorMessage: errorMsg,
              })
              .where(eq(dialogueRecords.id, record.id));

            return {
              task_id: taskId,
              status: 'FAILURE',
              progress: 0,
              error: errorMsg,
            };
          } else {
            // 更新进度
            const progress = taskState === 'generating' ? 60 : taskState === 'queuing' ? 30 : record.progress;
            if (progress !== record.progress) {
              await db.update(dialogueRecords)
                .set({ progress })
                .where(eq(dialogueRecords.id, record.id));
            }

            return {
              task_id: taskId,
              status: 'PROCESSING',
              progress,
            };
          }
        }
      }
    } catch (error) {
      console.error('查询 kie.ai 状态失败:', error);
    }
  }

  // 返回数据库中的状态
  return {
    task_id: taskId,
    status: record.status as DialogueTaskStatus['status'],
    progress: record.progress,
    audioUrl: record.audioUrl || undefined,
    error: record.errorMessage || undefined,
  };
}

/**
 * Dialogue 记录类型
 */
export interface DialogueRecord {
  id: number;
  task_id: string;
  status: string;
  progress: number;
  audio_url: string | null;
  dialogue_json: string;
  total_characters: number;
  credits_cost: number;
  duration: number | null;
  created_at: Date;
}

/**
 * 根据 task_id 获取单条 Dialogue 记录
 */
export async function getDialogueRecordByTaskId(taskId: string): Promise<DialogueRecord | null> {
  const { user_id: userId } = await getUserOrAnonymous();

  const [record] = await db.select({
    id: dialogueRecords.id,
    taskId: dialogueRecords.taskId,
    status: dialogueRecords.status,
    progress: dialogueRecords.progress,
    audioUrl: dialogueRecords.audioUrl,
    dialogueJson: dialogueRecords.dialogueJson,
    totalCharacters: dialogueRecords.totalCharacters,
    creditsCost: dialogueRecords.creditsCost,
    duration: dialogueRecords.duration,
    createdAt: dialogueRecords.createdAt,
  })
    .from(dialogueRecords)
    .where(and(eq(dialogueRecords.taskId, taskId), eq(dialogueRecords.userId, userId)))
    .limit(1);

  if (!record) return null;

  return {
    id: record.id,
    task_id: record.taskId,
    status: record.status,
    progress: record.progress,
    audio_url: record.audioUrl,
    dialogue_json: record.dialogueJson,
    total_characters: record.totalCharacters,
    credits_cost: record.creditsCost,
    duration: record.duration,
    created_at: new Date(record.createdAt),
  };
}

/**
 * 获取用户的 Dialogue 历史记录
 */
export async function getDialogueHistory(limit: number = 20): Promise<Array<{
  task_id: string;
  status: string;
  audio_url: string | null;
  total_characters: number;
  credits_cost: number;
  created_at: Date;
}>> {
  const { user_id: userId } = await getUserOrAnonymous();

  const records = await db.select({
    taskId: dialogueRecords.taskId,
    status: dialogueRecords.status,
    audioUrl: dialogueRecords.audioUrl,
    totalCharacters: dialogueRecords.totalCharacters,
    creditsCost: dialogueRecords.creditsCost,
    createdAt: dialogueRecords.createdAt,
  })
    .from(dialogueRecords)
    .where(eq(dialogueRecords.userId, userId))
    .orderBy(desc(dialogueRecords.createdAt))
    .limit(limit);

  return records.map(r => ({
    task_id: r.taskId,
    status: r.status,
    audio_url: r.audioUrl,
    total_characters: r.totalCharacters,
    credits_cost: r.creditsCost,
    created_at: new Date(r.createdAt),
  }));
}

/**
 * 获取用户的 Dialogue 记录列表（用于 My Creations）
 */
export async function getDialogueRecords(limit: number = 50): Promise<DialogueRecord[]> {
  const { user_id: userId } = await getUserOrAnonymous();

  const records = await db.select({
    id: dialogueRecords.id,
    taskId: dialogueRecords.taskId,
    status: dialogueRecords.status,
    progress: dialogueRecords.progress,
    audioUrl: dialogueRecords.audioUrl,
    dialogueJson: dialogueRecords.dialogueJson,
    totalCharacters: dialogueRecords.totalCharacters,
    creditsCost: dialogueRecords.creditsCost,
    duration: dialogueRecords.duration,
    createdAt: dialogueRecords.createdAt,
  })
    .from(dialogueRecords)
    .where(eq(dialogueRecords.userId, userId))
    .orderBy(desc(dialogueRecords.createdAt))
    .limit(limit);

  return records.map(r => ({
    id: r.id,
    task_id: r.taskId,
    status: r.status,
    progress: r.progress,
    audio_url: r.audioUrl,
    dialogue_json: r.dialogueJson,
    total_characters: r.totalCharacters,
    credits_cost: r.creditsCost,
    duration: r.duration,
    created_at: new Date(r.createdAt),
  }));
}

/**
 * 删除 Dialogue 记录
 */
export async function deleteDialogueRecord(id: number): Promise<void> {
  const { user_id: userId } = await getUserOrAnonymous();

  // 验证记录属于当前用户
  const [record] = await db.select().from(dialogueRecords)
    .where(and(eq(dialogueRecords.id, id), eq(dialogueRecords.userId, userId)))
    .limit(1);

  if (!record) {
    throw new Error('Record not found or not authorized to delete');
  }

  await db.delete(dialogueRecords).where(eq(dialogueRecords.id, id));
}
