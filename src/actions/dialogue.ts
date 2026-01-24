'use server';

/**
 * Dialogue 生成 Server Actions
 * 使用 kie.ai 的 elevenlabs/text-to-dialogue-v3 API
 */
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import prisma from '@/lib/prisma';
import { calculateDialogueCost } from '@/config/creditsCost';
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
  const { user_id: userId } = await getUserOrAnonymous();

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
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.credits < creditsRequired) {
    throw new Error(`Insufficient credits. Required: ${creditsRequired}, Current: ${user.credits}`);
  }

  const token = getKieApiToken();
  const taskId = uuidv4();
  const callbackUrl = getCallbackUrl();

  // 创建数据库记录
  await prisma.dialogue_records.create({
    data: {
      user_id: userId,
      task_id: taskId,
      dialogue_json: JSON.stringify(request.dialogue),
      total_characters: totalCharacters,
      credits_cost: creditsRequired,
      status: 'PENDING',
      progress: 0,
    },
  });

  // 调用 kie.ai API
  const apiBody: Record<string, unknown> = {
    model: 'elevenlabs/text-to-dialogue-v3',
    input: {
      dialogue: request.dialogue,
      stability: request.stability ?? 0.5,
    },
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
    await prisma.dialogue_records.update({
      where: { task_id: taskId },
      data: {
        status: 'FAILURE',
        error_message: `API request failed: ${response.status}`,
      },
    });

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
    await prisma.dialogue_records.update({
      where: { task_id: taskId },
      data: {
        status: 'FAILURE',
        error_message: result.msg || 'API returned error',
      },
    });
    throw new Error(result.msg || 'API returned error');
  }

  const externalTaskId = result.data.taskId;

  // 更新记录，保存外部任务 ID
  await prisma.dialogue_records.update({
    where: { task_id: taskId },
    data: {
      external_task_id: externalTaskId,
      status: 'PROCESSING',
      progress: 10,
    },
  });

  // 扣除积分
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      credits: { decrement: creditsRequired },
    },
  });

  // 记录积分消费历史
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: -creditsRequired,
      task_id: taskId,
      description: `Dialogue generation (${totalCharacters} chars)`,
      product_type: 'dialogue',
    },
  });

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
  const record = await prisma.dialogue_records.findUnique({
    where: { task_id: taskId },
  });

  if (!record) {
    throw new Error('Task not found');
  }

  // 如果已完成或失败，直接返回数据库状态
  if (record.status === 'SUCCESS' || record.status === 'FAILURE') {
    return {
      task_id: taskId,
      status: record.status as DialogueTaskStatus['status'],
      progress: record.progress,
      audioUrl: record.audio_url || undefined,
      error: record.error_message || undefined,
    };
  }

  // 如果还在处理中，查询 kie.ai API 获取最新状态
  if (record.external_task_id) {
    const token = getKieApiToken();

    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(record.external_task_id)}`,
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
            await prisma.dialogue_records.update({
              where: { id: record.id },
              data: {
                status: 'SUCCESS',
                progress: 100,
                audio_url: finalAudioUrl,
                completed_at: new Date(),
              },
            });

            return {
              task_id: taskId,
              status: 'SUCCESS',
              progress: 100,
              audioUrl: finalAudioUrl,
            };
          } else if (taskState === 'fail') {
            const errorMsg = result.data.failMsg || 'Generation failed';
            await prisma.dialogue_records.update({
              where: { id: record.id },
              data: {
                status: 'FAILURE',
                error_message: errorMsg,
              },
            });

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
              await prisma.dialogue_records.update({
                where: { id: record.id },
                data: { progress },
              });
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
    audioUrl: record.audio_url || undefined,
    error: record.error_message || undefined,
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

  const records = await prisma.dialogue_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      task_id: true,
      status: true,
      audio_url: true,
      total_characters: true,
      credits_cost: true,
      created_at: true,
    },
  });

  return records;
}

/**
 * 获取用户的 Dialogue 记录列表（用于 My Creations）
 */
export async function getDialogueRecords(limit: number = 50): Promise<DialogueRecord[]> {
  const { user_id: userId } = await getUserOrAnonymous();

  const records = await prisma.dialogue_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      task_id: true,
      status: true,
      progress: true,
      audio_url: true,
      dialogue_json: true,
      total_characters: true,
      credits_cost: true,
      duration: true,
      created_at: true,
    },
  });

  return records;
}

/**
 * 删除 Dialogue 记录
 */
export async function deleteDialogueRecord(id: number): Promise<void> {
  const { user_id: userId } = await getUserOrAnonymous();

  // 验证记录属于当前用户
  const record = await prisma.dialogue_records.findFirst({
    where: { id, user_id: userId },
  });

  if (!record) {
    throw new Error('Record not found or not authorized to delete');
  }

  await prisma.dialogue_records.delete({
    where: { id },
  });
}
