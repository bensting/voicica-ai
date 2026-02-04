'use server';

/**
 * Image 模块 Server Actions
 * 使用 KIE API 生成图片
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { checkCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { getImageModelById } from '@/config/native/imageModels';
import { moderateImagePrompt } from '@/lib/moderation';

// KIE API 配置
const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

/**
 * 创建图片生成任务参数
 */
export interface CreateImageTaskParams {
  modelId: string;
  prompt: string;
  aspectRatio: string;
  quality: string;
  isPublic?: boolean;
  guidanceImageUrl?: string;
}

/**
 * 创建图片生成任务结果
 */
export interface CreateImageTaskResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

/**
 * 创建图片生成任务
 */
export async function createImageTask(
  params: CreateImageTaskParams
): Promise<CreateImageTaskResult> {
  try {
    // 验证用户身份
    const { user_id, is_anonymous } = await getUserOrAnonymous();
    if (!user_id) {
      return { success: false, error: 'Please login first' };
    }

    // 匿名用户不能使用此功能
    if (is_anonymous) {
      return { success: false, error: 'Please login to use AI Image' };
    }

    // 获取模型配置
    const model = getImageModelById(params.modelId);
    if (!model) {
      return { success: false, error: 'Invalid model' };
    }

    // 检查积分
    const creditsCheck = await checkCredits(user_id, model.credits, is_anonymous);
    if (!creditsCheck.hasEnough) {
      return { success: false, error: 'Insufficient credits' };
    }

    // 内容审核 - 检查提示词是否包含违规内容
    const moderationResult = await moderateImagePrompt(params.prompt);
    if (!moderationResult.passed) {
      console.log(`🚫 [createImageTask] Content moderation failed for user ${user_id}`);
      return {
        success: false,
        error: 'Your prompt contains content that violates our usage policy. Please modify your prompt and try again.',
      };
    }

    // 构建请求参数
    let input: Record<string, unknown>;
    let actualModelId = params.modelId; // 实际调用的模型 ID（可能根据是否有图片输入而变化）
    const hasImageInput = !!params.guidanceImageUrl;

    switch (params.modelId) {
      case 'z-image':
        // Z-Image - 快速便宜，没有 quality 选项，不支持图片输入
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
        };
        break;

      case 'flux-2':
        // Flux.2 - 根据是否有图片输入使用不同模型
        actualModelId = hasImageInput ? 'flux-2/flex-image-to-image' : 'flux-2/flex-text-to-image';
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          resolution: params.quality, // '1K', '2K'
        };
        if (hasImageInput) {
          input.image_input = [params.guidanceImageUrl];
        }
        break;

      case 'seedream/4.5-text-to-image':
        // Seedream 4.5 - 根据是否有图片输入使用不同模型
        actualModelId = hasImageInput ? 'seedream/4.5-edit' : 'seedream/4.5-text-to-image';
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality: params.quality, // 'basic' (2K) or 'high' (4K)
        };
        if (hasImageInput) {
          input.image_input = [params.guidanceImageUrl];
        }
        break;

      case 'nano-banana-pro':
      default:
        // Nano Banana Pro - 同一个模型支持图片输入
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          resolution: params.quality, // '1K', '2K', '4K'
          output_format: 'png',
        };
        if (hasImageInput) {
          input.image_input = [params.guidanceImageUrl];
        }
        break;
    }

    // callBackUrl 是 KIE API 必需的参数（任务完成后的回调地址）
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';

    const kiePayload = {
      model: actualModelId,
      input,
      callBackUrl: `${appUrl}/api/webhooks/kie-image`,
    };

    console.log('🖼️ [createImageTask] 调用 KIE API:', JSON.stringify(kiePayload, null, 2));

    // 调用 KIE AI API (使用 /jobs/createTask 端点)
    const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(kiePayload),
    });

    const result = await response.json();
    console.log('🖼️ [createImageTask] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200 || !result.data?.taskId) {
      return { success: false, error: result.msg || 'Failed to create task' };
    }

    const taskId = result.data.taskId;

    // 扣除积分
    await prisma.$transaction([
      prisma.users.update({
        where: { user_id: user_id },
        data: { credits: { decrement: model.credits } },
      }),
      prisma.credit_history.create({
        data: {
          user_id: user_id,
          amount: -model.credits,
          product_type: ProductType.IMAGE,
          description: `AI Image generation (${model.name})`,
        },
      }),
    ]);

    // 创建图片记录
    await prisma.image_records.create({
      data: {
        user_id: user_id,
        task_id: taskId,
        model: params.modelId,
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        quality: params.quality,
        status: 'PENDING',
        is_public: params.isPublic ?? false,
        credits_used: model.credits,
      },
    });

    return { success: true, taskId };
  } catch (error) {
    console.error('❌ [createImageTask] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create image task',
    };
  }
}

/**
 * 图片任务状态
 */
export interface ImageTaskStatus {
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
  imageUrl?: string;
  error?: string;
}

/**
 * 获取图片任务状态
 */
export async function getImageTaskStatus(taskId: string): Promise<ImageTaskStatus> {
  try {
    // 使用 GET /jobs/recordInfo 端点查询任务状态
    const response = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      console.error('❌ [getImageTaskStatus] API error:', response.status, response.statusText);
      // Return PROCESSING status to continue polling (might be temporary server error)
      return { status: 'PROCESSING', progress: 50 };
    }

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ [getImageTaskStatus] Invalid content type:', contentType);
      // Return PROCESSING status to continue polling
      return { status: 'PROCESSING', progress: 50 };
    }

    const result = await response.json();
    console.log('🖼️ [getImageTaskStatus] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      return { status: 'FAILURE', error: result.msg || 'Failed to get task status' };
    }

    const task = result.data;
    // KIE API 返回 state: 'waiting' | 'success' | 'fail'
    let status: ImageTaskStatus['status'] = 'PENDING';
    if (task.state === 'success') {
      status = 'SUCCESS';
    } else if (task.state === 'fail') {
      status = 'FAILURE';
    } else if (task.state === 'waiting') {
      status = 'PROCESSING';
    }

    // 解析结果 (resultJson 是 JSON 字符串)
    let imageUrl: string | undefined;
    if (task.resultJson) {
      try {
        const resultData = JSON.parse(task.resultJson);
        imageUrl = resultData.image_url || resultData.resultUrls?.[0];
      } catch {
        console.error('🖼️ [getImageTaskStatus] 解析 resultJson 失败:', task.resultJson);
      }
    }

    // 更新数据库记录
    if (status === 'SUCCESS' && imageUrl) {
      await prisma.image_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'SUCCESS',
          image_url: imageUrl,
          completed_at: new Date(),
        },
      });
    } else if (status === 'FAILURE') {
      await prisma.image_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error: task.failMsg || 'Generation failed',
        },
      });
    }

    return {
      status,
      progress: status === 'SUCCESS' ? 100 : (status === 'PROCESSING' ? 50 : 0),
      imageUrl,
      error: task.failMsg,
    };
  } catch (error) {
    console.error('❌ [getImageTaskStatus] Error:', error);
    return {
      status: 'FAILURE',
      error: error instanceof Error ? error.message : 'Failed to get task status',
    };
  }
}

/**
 * 图片记录类型
 */
export interface ImageRecord {
  id: number;
  user_id: string;
  task_id: string;
  model: string;
  prompt: string;
  aspect_ratio: string;
  quality: string;
  status: string;
  progress: number;
  image_url: string | null;
  is_public: boolean;
  credits_used: number;
  error: string | null;
  completed_at: Date | null;
  created_at: Date;
}

/**
 * 获取用户的图片记录列表
 */
export async function getImageRecords(limit: number = 50): Promise<ImageRecord[]> {
  try {
    const { user_id } = await getUserOrAnonymous();
    if (!user_id) {
      return [];
    }

    const records = await prisma.image_records.findMany({
      where: { user_id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return records as ImageRecord[];
  } catch (error) {
    console.error('❌ [getImageRecords] Error:', error);
    return [];
  }
}

/**
 * 删除图片记录
 */
export async function deleteImageRecord(id: number): Promise<boolean> {
  try {
    const { user_id } = await getUserOrAnonymous();
    if (!user_id) {
      return false;
    }

    await prisma.image_records.deleteMany({
      where: {
        id,
        user_id,
      },
    });

    return true;
  } catch (error) {
    console.error('❌ [deleteImageRecord] Error:', error);
    return false;
  }
}

/**
 * 根据 taskId 获取单条图片记录
 */
export async function getImageRecordByTaskId(taskId: string): Promise<ImageRecord | null> {
  try {
    const { user_id } = await getUserOrAnonymous();
    if (!user_id) {
      return null;
    }

    const record = await prisma.image_records.findFirst({
      where: {
        task_id: taskId,
        user_id,
      },
    });

    return record as ImageRecord | null;
  } catch (error) {
    console.error('❌ [getImageRecordByTaskId] Error:', error);
    return null;
  }
}
