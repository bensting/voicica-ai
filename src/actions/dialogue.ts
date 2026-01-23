'use server';

/**
 * Dialogue 生成 Server Actions
 * 使用 kie.ai 的 elevenlabs/text-to-dialogue-v3 API
 */
import { getCurrentUser } from '@/lib/auth-firebase';
import prisma from '@/lib/prisma';
import { calculateDialogueCost } from '@/config/creditsCost';

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
  taskId: string;
  recordId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
}

/**
 * 获取 kie.ai API Token
 */
function getKieApiToken(): string {
  const token = process.env.KIE_API_KEY;
  if (!token) {
    throw new Error('未配置 KIE_API_KEY 环境变量');
  }
  return token;
}

/**
 * 创建 Dialogue 生成任务
 */
export async function createDialogueTask(
  request: DialogueRequest
): Promise<DialogueTaskStatus> {
  const { uid: userId } = await getCurrentUser();

  // 计算总字符数
  const totalCharacters = request.dialogue.reduce(
    (sum, d) => sum + d.text.length,
    0
  );

  if (totalCharacters === 0) {
    throw new Error('对话内容不能为空');
  }

  if (totalCharacters > 5000) {
    throw new Error('对话总字符数不能超过 5000');
  }

  // 计算消耗的积分
  const creditsRequired = calculateDialogueCost(totalCharacters);

  // 检查用户积分
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.credits < creditsRequired) {
    throw new Error(`积分不足，需要 ${creditsRequired} 积分`);
  }

  const token = getKieApiToken();

  // 调用 kie.ai API
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'elevenlabs/text-to-dialogue-v3',
      input: {
        dialogue: request.dialogue,
        stability: request.stability ?? 0.5,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('kie.ai API 错误:', response.status, errorText);

    if (response.status === 401) {
      throw new Error('API 认证失败');
    }
    if (response.status === 402) {
      throw new Error('API 积分不足');
    }
    if (response.status === 422) {
      throw new Error('请求参数错误');
    }

    throw new Error(`API 请求失败: ${response.status}`);
  }

  const result = await response.json();

  if (result.code !== 200) {
    throw new Error(result.msg || 'API 返回错误');
  }

  const { taskId, recordId } = result.data;

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
    taskId,
    recordId,
    status: 'pending',
  };
}

/**
 * 获取 Dialogue 任务状态
 */
export async function getDialogueTaskStatus(
  taskId: string
): Promise<DialogueTaskStatus> {
  await getCurrentUser();

  const token = getKieApiToken();

  // 调用 kie.ai 获取任务状态 API - 使用 /jobs/recordInfo 端点
  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('获取任务状态失败:', response.status, errorText);
    throw new Error(`获取任务状态失败: ${response.status}`);
  }

  const result = await response.json();

  if (result.code !== 200) {
    throw new Error(result.msg || '获取任务状态失败');
  }

  const taskData = result.data;

  // kie.ai 使用 state 字段：waiting, queuing, generating, success, fail
  const taskState = (taskData.state || '').toLowerCase();

  // 解析 resultJson 获取音频 URL
  let audioUrl: string | undefined;
  if (taskData.resultJson) {
    try {
      const resultData = JSON.parse(taskData.resultJson);
      audioUrl = resultData.resultUrls?.[0] || resultData.audio_url;
    } catch {
      // ignore parse error
    }
  }

  // 映射状态
  let status: DialogueTaskStatus['status'] = 'pending';
  if (taskState === 'success') {
    status = 'completed';
  } else if (taskState === 'waiting' || taskState === 'queuing' || taskState === 'generating') {
    status = 'processing';
  } else if (taskState === 'fail') {
    status = 'failed';
  }

  return {
    taskId,
    status,
    audioUrl,
    error: taskData.failMsg,
  };
}
