'use server';

import { getKieAIClient } from '@/lib/kie-ai';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

/**
 * AI Image 模型配置
 */
export interface ImageModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  credits: number;
  maxPromptLength: number;
  supportsImageInput: boolean;
  aspectRatios: string[];
  qualities: { id: string; label: string; isPro?: boolean }[];
}

export const imageModels: ImageModel[] = [
  {
    id: 'z-image',
    name: 'Z-Image',
    description: 'Fast and affordable',
    icon: '/images/models/z-image.png',
    credits: 1,
    maxPromptLength: 2000,
    supportsImageInput: false,
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    qualities: [
      { id: 'standard', label: '1K' },
    ],
  },
  {
    id: 'flux-2',
    name: 'Flux.2',
    description: 'Balanced quality and speed',
    icon: '/images/models/flux-2.png',
    credits: 10,
    maxPromptLength: 4000,
    supportsImageInput: false,
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'],
    qualities: [
      { id: 'standard', label: '1K' },
      { id: 'hd', label: '2K', isPro: true },
    ],
  },
  {
    id: 'seedream/4.5-text-to-image',
    name: 'Seedream 4.5',
    description: 'High-quality, diverse styles',
    icon: '/images/models/seedream.png',
    credits: 15,
    maxPromptLength: 3000,
    supportsImageInput: false,
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
    qualities: [
      { id: 'basic', label: '2K' },
      { id: 'high', label: '4K', isPro: true },
    ],
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana - Pro',
    description: 'With reasoning ability, most powerful',
    icon: '/images/models/nano-banana.png',
    credits: 20,
    maxPromptLength: 10000,
    supportsImageInput: true,
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    qualities: [
      { id: '1K', label: '1K' },
      { id: '2K', label: '2K', isPro: true },
      { id: '4K', label: '4K', isPro: true },
    ],
  },
];

/**
 * 获取默认模型
 */
export async function getDefaultModel(): Promise<ImageModel> {
  return imageModels[0]; // Seedream 4.5
}

/**
 * 获取所有可用模型
 */
export async function getImageModels(): Promise<ImageModel[]> {
  return imageModels;
}

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
    const authResult = await verifyAuth();
    if (!authResult.authenticated || !authResult.user) {
      return { success: false, error: 'Please login first' };
    }

    const userId = authResult.user.id;

    // 获取模型配置
    const model = imageModels.find((m) => m.id === params.modelId);
    if (!model) {
      return { success: false, error: 'Invalid model' };
    }

    // 检查积分
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < model.credits) {
      return { success: false, error: 'Insufficient credits' };
    }

    // 构建请求参数
    const client = getKieAIClient();
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

    // 调用 KIE AI API
    const response = await client.createTask({
      model: params.modelId,
      input,
    });

    if (response.code !== 200 || !response.data?.taskId) {
      return { success: false, error: response.msg || 'Failed to create task' };
    }

    const taskId = response.data.taskId;

    // 扣除积分
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: model.credits } },
      }),
      prisma.credit_history.create({
        data: {
          user_id: userId,
          amount: -model.credits,
          type: 'USAGE',
          product_type: 'IMAGE',
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
    const client = getKieAIClient();
    const response = await client.getTaskDetails(taskId);

    if (response.code !== 200) {
      return { status: 'FAILURE', error: response.msg || 'Failed to get task status' };
    }

    const task = response.data;
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
