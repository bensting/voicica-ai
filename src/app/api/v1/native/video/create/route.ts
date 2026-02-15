/**
 * Native App Video Creation API
 *
 * POST /api/v1/native/video/create
 * 创建视频生成任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { videoRecords, taskQueue, users, anonymousUsers, creditHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { createKieVideoTask } from '@/lib/services/kie-video';
import { videoModelsConfig, calculateCredits } from '@/config/native/videoModels';
import { uploadImage } from '@/lib/services/r2-storage';

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

    // 5. 验证并计算积分消耗（使用 creditsMatrix，和前端一致）
    const creditsCost = calculateCredits(modelConfig, quality, duration, generateAudio);
    if (creditsCost <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quality/duration combination' },
        { status: 400 }
      );
    }

    // 6. 检查用户积分
    let userCredits = 0;
    if (is_anonymous) {
      const [anonUser] = await db.select({ credits: anonymousUsers.credits }).from(anonymousUsers).where(eq(anonymousUsers.userId, user_id)).limit(1);
      userCredits = anonUser?.credits || 0;
    } else {
      const [regUser] = await db.select({ credits: users.credits }).from(users).where(eq(users.userId, user_id)).limit(1);
      userCredits = regUser?.credits || 0;
    }

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

    // 7. 上传图片到 R2（在创建 DB 记录之前）
    // Kie.ai API 需要图片 URL，base64 需要先上传到 R2
    let startFrameUrl: string | undefined;
    let imageUrls: string[] | undefined;

    try {
      // 上传起始帧
      if (startFrame && startFrame.startsWith('data:')) {
        console.log('📤 [NativeVideo] 上传起始帧图片到 R2...');
        const matches = startFrame.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const extension = contentType.split('/')[1] || 'jpg';
          const imageFileName = `${uuidv4()}.${extension}`;
          startFrameUrl = await uploadImage(
            imageBuffer,
            imageFileName,
            contentType,
            `video-frames/${user_id}`
          );
          console.log('✅ [NativeVideo] 起始帧上传成功:', startFrameUrl);
        }
      } else if (startFrame) {
        // 已经是 URL
        startFrameUrl = startFrame;
      }

      // 上传多图模式的图片
      if (images && images.length > 0) {
        imageUrls = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.startsWith('data:')) {
            console.log(`📤 [NativeVideo] 上传图片 ${i + 1}/${images.length} 到 R2...`);
            const matches = img.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const contentType = matches[1];
              const base64Data = matches[2];
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const extension = contentType.split('/')[1] || 'jpg';
              const imageFileName = `${uuidv4()}.${extension}`;
              const url = await uploadImage(
                imageBuffer,
                imageFileName,
                contentType,
                `video-frames/${user_id}`
              );
              imageUrls.push(url);
              console.log(`✅ [NativeVideo] 图片 ${i + 1} 上传成功:`, url);
            }
          } else {
            // 已经是 URL
            imageUrls.push(img);
          }
        }
      }
    } catch (uploadError) {
      console.error('❌ [NativeVideo] 图片上传失败:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload image',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // 8. 生成任务 ID
    const taskId = `video_${uuidv4()}`;
    const durationSeconds = parseDuration(duration);

    // 9. 创建视频记录 (PENDING 状态)
    await db.insert(videoRecords).values({
      userId: user_id,
      taskId,
      taskType: 'text_to_video',
      model: modelId,
      prompt: prompt.trim(),
      negativePrompt,
      resolution: normalizeResolution(quality),
      duration: durationSeconds,
      aspectRatio,
      seed,
      isPublic: visibility === 'public',
      creditsCost,
      status: 'PENDING',
      progress: 0,
    });

    // 10. 创建任务队列记录
    await db.insert(taskQueue).values({
      userId: user_id,
      taskId,
      taskType: 'text_to_video',
      status: 'PENDING',
      priority: 0,
      payload: {
        prompt: prompt.trim(),
        modelId,
        quality,
        duration,
        aspectRatio,
      },
      retryCount: 0,
      maxRetries: 3,
      timeoutSeconds: 600,
    });

    // 11. 直接调用 Kie.ai API
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.voicica.ai'}/api/webhooks/kie-video`;

    // 构建输入图片 URL 数组（优先使用 images，其次 startFrameUrl）
    const inputUrls = imageUrls && imageUrls.length > 0
      ? imageUrls
      : startFrameUrl ? [startFrameUrl] : undefined;

    let externalTaskId: string;
    try {
      externalTaskId = await createKieVideoTask({
        prompt: prompt.trim(),
        inputUrls,
        aspectRatio: aspectRatio as '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16',
        resolution: normalizeResolution(quality) as '480p' | '720p',
        duration: String(durationSeconds) as '4' | '8' | '12',
        fixedLens: fixedLens ?? false,
        generateAudio: generateAudio ?? false,
        callBackUrl: callbackUrl,
      });
    } catch (apiError) {
      // API 调用失败，清理 DB 记录
      console.error('❌ [NativeVideo] Kie.ai API 调用失败:', apiError);
      await db.update(videoRecords)
        .set({
          status: 'FAILURE',
          errorMessage: apiError instanceof Error ? apiError.message : 'Kie.ai API call failed',
          completedAt: new Date().toISOString(),
        })
        .where(eq(videoRecords.taskId, taskId));
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit video generation task',
          details: apiError instanceof Error ? apiError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // 12. API 成功后扣减积分
    if (is_anonymous) {
      await db.update(anonymousUsers)
        .set({ credits: sql`${anonymousUsers.credits} - ${creditsCost}` })
        .where(eq(anonymousUsers.userId, user_id));
    } else {
      await db.update(users)
        .set({ credits: sql`${users.credits} - ${creditsCost}` })
        .where(eq(users.userId, user_id));
    }

    await db.insert(creditHistory).values({
      userId: user_id,
      amount: -creditsCost,
      taskId,
      description: `AI Video generation (Seedance 1.5 Pro)`,
      productType: 'text_to_video',
    });

    // 13. 保存外部任务 ID，更新状态为 PROCESSING
    await db.update(videoRecords)
      .set({
        externalTaskId,
        status: 'PROCESSING',
        progress: 10,
      })
      .where(eq(videoRecords.taskId, taskId));

    console.log(
      `✅ [NativeVideo] 任务已提交到 Kie.ai: ${taskId} -> ${externalTaskId}, credits=${creditsCost}`
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
