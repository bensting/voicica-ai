/**
 * Native App Video Creation API
 *
 * POST /api/v1/native/video/create
 * 创建视频生成任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { videoQueue } from '@/lib/queue/video-queue';
import { videoModelsConfig } from '@/config/native/videoModels';

// 请求参数
interface CreateVideoRequest {
  prompt: string;
  modelId: string;
  quality: string;
  duration: string;
  aspectRatio: string;
  visibility: 'public' | 'private';
  negativePrompt?: string;
  seed?: number;
  /** 起始帧图片 (base64) */
  startFrame?: string;
  /** 结束帧图片 (base64) - 仅部分模型支持 */
  endFrame?: string;
  /** 多图模式下的参考图片数组 (base64) */
  images?: string[];
  /** 固定镜头 - Seedance 模型专用 */
  fixedLens?: boolean;
  /** 生成音频 - Seedance 模型专用 */
  generateAudio?: boolean;
}

/**
 * 将前端分辨率 (512p, 768p, 1080p) 转换为 API 使用的分辨率
 */
function normalizeResolution(quality: string): string {
  // 直接返回，让后端 queue 处理转换
  return quality;
}

/**
 * 将前端时长 (8s, 10s) 转换为数字秒
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)s?$/);
  return match ? parseInt(match[1], 10) : 8;
}

export async function POST(req: NextRequest) {
  try {
    // 1. 获取用户身份
    const { user_id, is_anonymous } = await getUserOrAnonymous();

    // 2. 解析请求参数
    const body: CreateVideoRequest = await req.json();
    const {
      prompt,
      modelId,
      quality,
      duration,
      aspectRatio,
      visibility,
      negativePrompt,
      seed,
      startFrame,
      endFrame,
      images,
      fixedLens,
      generateAudio,
    } = body;

    // 3. 验证参数
    if (!prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // 4. 查找模型配置
    const modelConfig = videoModelsConfig.find((m) => m.id === modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid model' },
        { status: 400 }
      );
    }

    // 5. 验证并获取积分消耗
    const qualityOption = modelConfig.qualityOptions.find((q) => q.value === quality);
    if (!qualityOption) {
      return NextResponse.json(
        { success: false, error: 'Invalid quality option' },
        { status: 400 }
      );
    }

    const creditsCost = qualityOption.credits;

    // 6. 检查用户积分
    const userCredits = is_anonymous
      ? (await prisma.anonymous_users.findUnique({ where: { user_id } }))?.credits || 0
      : (await prisma.users.findUnique({ where: { user_id } }))?.credits || 0;

    if (userCredits < creditsCost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient credits',
          required: creditsCost,
          available: userCredits,
        },
        { status: 402 }
      );
    }

    // 7. 生成任务 ID
    const taskId = `video_${uuidv4()}`;

    // 8. 创建视频记录 (PENDING 状态)
    await prisma.video_records.create({
      data: {
        user_id,
        task_id: taskId,
        task_type: 'text_to_video',
        model: modelId,
        prompt: prompt.trim(),
        negative_prompt: negativePrompt,
        resolution: normalizeResolution(quality),
        duration: parseDuration(duration),
        aspect_ratio: aspectRatio,
        seed,
        is_public: visibility === 'public',
        credits_cost: creditsCost,
        status: 'PENDING',
        progress: 0,
      },
    });

    // 9. 创建任务队列记录
    await prisma.task_queue.create({
      data: {
        user_id,
        task_id: taskId,
        task_type: 'text_to_video',
        status: 'PENDING',
        priority: 0,
        payload: {
          prompt: prompt.trim(),
          modelId,
          quality,
          duration,
          aspectRatio,
        },
        retry_count: 0,
        max_retries: 3,
        timeout_seconds: 600, // 10 minutes
      },
    });

    // 10. 提交到队列处理
    await videoQueue.enqueue({
      taskId,
      userId: user_id,
      prompt: prompt.trim(),
      negativePrompt,
      resolution: normalizeResolution(quality) as '768p' | '1080p',
      duration: parseDuration(duration) as 5 | 8 | 10 | 15,
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9',
      model: modelConfig.apiModelId,
      seed,
      creditsCost,
      isAnonymous: is_anonymous,
      startFrame,
      endFrame,
      images,
      fixedLens,
      generateAudio,
    });

    console.log(
      `✅ [NativeVideo] 任务已创建: ${taskId}, model=${modelId}, credits=${creditsCost}`
    );

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Video generation task created',
    });
  } catch (error) {
    console.error('❌ [NativeVideo] 创建任务失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create video task',
      },
      { status: 500 }
    );
  }
}
