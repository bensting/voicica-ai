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
  imageCount?: number;
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
    const { userId, isAnonymous } = await getUserOrAnonymous();
    if (!userId) {
      return { success: false, error: 'Please login first' };
    }

    // 匿名用户不能使用此功能
    if (isAnonymous) {
      return { success: false, error: 'Please login to use AI Image' };
    }

    // 获取模型配置
    const model = getImageModelById(params.modelId);
    if (!model) {
      return { success: false, error: 'Invalid model' };
    }

    // 检查积分
    const creditsCheck = await checkCredits(userId, model.credits, isAnonymous);
    if (!creditsCheck.hasEnough) {
      return { success: false, error: 'Insufficient credits' };
    }

    // 构建请求参数
    let input: Record<string, unknown>;

    switch (params.modelId) {
      case 'z-image':
        // Z-Image - 快速便宜
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
        };
        break;

      case 'flux-2':
        // Flux.2
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality: params.quality, // 'standard' or 'hd'
        };
        break;

      case 'seedream/4.5-text-to-image':
        // Seedream 4.5
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality: params.quality, // 'basic' or 'high'
        };
        break;

      case 'nano-banana-pro':
      default:
        // Nano Banana Pro
        input = {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          resolution: params.quality, // '1K', '2K', '4K'
          output_format: 'png',
        };

        // 如果有引导图片
        if (params.guidanceImageUrl) {
          input.image_input = [params.guidanceImageUrl];
        }
        break;
    }

    const kiePayload = {
      model: params.modelId,
      input,
    };

    console.log('🖼️ [createImageTask] 调用 KIE API:', JSON.stringify(kiePayload, null, 2));

    // 调用 KIE AI API
    const response = await fetch(`${KIE_API_BASE}/generate`, {
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
        where: { user_id: userId },
        data: { credits: { decrement: model.credits } },
      }),
      prisma.credit_history.create({
        data: {
          user_id: userId,
          amount: -model.credits,
          type: 'USAGE',
          product_type: ProductType.IMAGE,
          description: `AI Image generation (${model.name})`,
        },
      }),
    ]);

    // 创建图片记录
    await prisma.image_records.create({
      data: {
        user_id: userId,
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
    // 使用 GET /generate/record-info 端点查询任务状态
    const response = await fetch(`${KIE_API_BASE}/generate/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    const result = await response.json();

    if (result.code !== 200) {
      return { status: 'FAILURE', error: result.msg || 'Failed to get task status' };
    }

    const task = result.data;
    const status = task.status?.toUpperCase() as ImageTaskStatus['status'];

    // 更新数据库记录
    if (status === 'SUCCESS' && task.output?.image_url) {
      await prisma.image_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'SUCCESS',
          image_url: task.output.image_url,
          completed_at: new Date(),
        },
      });
    } else if (status === 'FAILURE') {
      await prisma.image_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error: task.error || 'Generation failed',
        },
      });
    }

    return {
      status: status || 'PENDING',
      progress: task.progress,
      imageUrl: task.output?.image_url,
      error: task.error,
    };
  } catch (error) {
    console.error('❌ [getImageTaskStatus] Error:', error);
    return {
      status: 'FAILURE',
      error: error instanceof Error ? error.message : 'Failed to get task status',
    };
  }
}
