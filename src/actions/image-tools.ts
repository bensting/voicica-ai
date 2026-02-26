'use server';

/**
 * Image Tools Server Actions
 * BG Remove & HD Upscale - 使用 KIE API (Recraft 模型)
 */
import { getDb } from '@/lib/db';
import { imageToolRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { checkCredits, deductCredits, refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { creditsCostConfig } from '@/config/creditsCost';
import { uploadImage } from '@/lib/services/r2-storage';
import { v4 as uuidv4 } from 'uuid';

// KIE API 配置
const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

// 每个工具消耗的积分（从配置读取）
const CREDITS_PER_TASK = creditsCostConfig[ProductType.IMAGE_TOOL] || 1;

// 工具类型到 KIE 模型的映射
const TOOL_MODEL_MAP: Record<ImageToolType, string> = {
  'bg-remove': 'recraft/remove-background',
  'upscale': 'recraft/crisp-upscale',
};

export type ImageToolType = 'bg-remove' | 'upscale';

export interface ImageToolTaskStatus {
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  originalImageUrl?: string;
  resultImageUrl?: string;
  error?: string;
}

/**
 * 创建图片工具任务
 * 1. 获取用户（匿名也可用）
 * 2. 检查积分
 * 3. 上传原图到 R2
 * 4. 调用 KIE API
 * 5. 立即扣除积分
 * 6. 插入 DB 记录
 */
export async function createImageToolTask(
  toolType: ImageToolType,
  imageBase64: string
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  const db = await getDb();
  try {
    // 验证用户身份（匿名也可用）
    const { user_id, is_anonymous } = await getUserOrAnonymous();
    if (!user_id) {
      return { success: false, error: 'Unable to identify user' };
    }

    // 检查积分
    const creditsCheck = await checkCredits(user_id, CREDITS_PER_TASK, is_anonymous);
    if (!creditsCheck.hasEnough) {
      return { success: false, error: 'Insufficient credits' };
    }

    // 解析 base64 图片并上传到 R2
    const base64Match = imageBase64.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!base64Match) {
      return { success: false, error: 'Invalid image format' };
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 文件大小校验
    const maxSize = toolType === 'bg-remove' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      const maxMB = toolType === 'bg-remove' ? 5 : 10;
      return { success: false, error: `Image size exceeds ${maxMB}MB limit` };
    }

    const ext = mimeType === 'jpeg' || mimeType === 'jpg' ? 'jpg' : mimeType === 'png' ? 'png' : 'webp';
    const contentType = `image/${mimeType}`;
    const fileName = `${uuidv4()}.${ext}`;
    const folder = `image-tools/${user_id}`;

    const originalImageUrl = await uploadImage(buffer, fileName, contentType, folder);
    console.log(`📤 [createImageToolTask] 原图已上传到 R2: ${originalImageUrl}`);

    // 调用 KIE API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';
    const kiePayload = {
      model: TOOL_MODEL_MAP[toolType],
      input: { image: originalImageUrl },
      callBackUrl: `${appUrl}/api/webhooks/kie-image-tools`,
    };

    console.log('🔧 [createImageToolTask] 调用 KIE API:', JSON.stringify(kiePayload, null, 2));

    const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(kiePayload),
    });

    const result = await response.json();
    console.log('🔧 [createImageToolTask] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200 || !result.data?.taskId) {
      return { success: false, error: result.msg || 'Failed to create task' };
    }

    const taskId = result.data.taskId;

    // 立即扣除积分
    const toolLabel = toolType === 'bg-remove' ? 'BG Remove' : 'HD Upscale';
    await deductCredits(user_id, CREDITS_PER_TASK, ProductType.IMAGE_TOOL, is_anonymous, `Image Tool: ${toolLabel}`);

    // 插入 DB 记录
    await db.insert(imageToolRecords).values({
      userId: user_id,
      taskId,
      toolType,
      status: 'PENDING',
      originalImageUrl,
      creditsUsed: CREDITS_PER_TASK,
    });

    return { success: true, taskId };
  } catch (error) {
    console.error('❌ [createImageToolTask] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create image tool task',
    };
  }
}

/**
 * 获取图片工具任务状态
 * 1. 先查 DB，如已是终态直接返回
 * 2. 如仍 PENDING → 查询 KIE API
 * 3. 使用乐观锁防止和 webhook 竞争
 */
export async function getImageToolTaskStatus(taskId: string): Promise<ImageToolTaskStatus> {
  const db = await getDb();
  try {
    // 先查 DB 记录
    const [record] = await db.select().from(imageToolRecords)
      .where(eq(imageToolRecords.taskId, taskId))
      .limit(1);

    if (!record) {
      return { status: 'FAILURE', error: 'Record not found' };
    }

    // 如果已是终态，直接返回
    if (record.status === 'SUCCESS') {
      return { status: 'SUCCESS', originalImageUrl: record.originalImageUrl, resultImageUrl: record.resultImageUrl || undefined };
    }
    if (record.status === 'FAILURE') {
      return { status: 'FAILURE', originalImageUrl: record.originalImageUrl, error: record.error || 'Processing failed' };
    }

    // 仍 PENDING → 查询 KIE API
    const response = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('❌ [getImageToolTaskStatus] API error:', response.status, response.statusText);
      return { status: 'PROCESSING' };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ [getImageToolTaskStatus] Invalid content type:', contentType);
      return { status: 'PROCESSING' };
    }

    const result = await response.json();
    console.log('🔧 [getImageToolTaskStatus] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      return { status: 'FAILURE', error: result.msg || 'Failed to get task status' };
    }

    const task = result.data;

    if (task.state === 'success' && task.resultJson) {
      // 解析结果 URL
      let resultUrl: string | undefined;
      try {
        const resultData = JSON.parse(task.resultJson);
        resultUrl = resultData.image_url || resultData.resultUrls?.[0];
      } catch {
        console.error('🔧 [getImageToolTaskStatus] 解析 resultJson 失败:', task.resultJson);
      }

      if (resultUrl) {
        // 乐观锁：只有 PENDING 状态的记录才处理，防止和 webhook 竞争
        const updateResult = await db.update(imageToolRecords)
          .set({
            progress: 99, // 标记已认领下载
          })
          .where(
            and(
              eq(imageToolRecords.taskId, taskId),
              eq(imageToolRecords.status, 'PENDING'),
              eq(imageToolRecords.progress, 0) // 乐观锁
            )
          )
          .returning();

        if (updateResult.length > 0) {
          // 成功认领，下载图片到 R2
          const r2Url = await downloadResultToR2(resultUrl, taskId, record.userId);
          const finalUrl = r2Url || resultUrl;

          await db.update(imageToolRecords)
            .set({
              status: 'SUCCESS',
              resultImageUrl: finalUrl,
              completedAt: new Date().toISOString(),
            })
            .where(eq(imageToolRecords.taskId, taskId));

          return { status: 'SUCCESS', originalImageUrl: record.originalImageUrl, resultImageUrl: finalUrl };
        } else {
          // 已被 webhook 处理，重新查 DB
          const [updatedRecord] = await db.select().from(imageToolRecords)
            .where(eq(imageToolRecords.taskId, taskId))
            .limit(1);

          if (updatedRecord?.status === 'SUCCESS') {
            return { status: 'SUCCESS', originalImageUrl: record.originalImageUrl, resultImageUrl: updatedRecord.resultImageUrl || undefined };
          }
          // webhook 可能还在处理中
          return { status: 'PROCESSING' };
        }
      }
    }

    if (task.state === 'fail') {
      // 乐观锁：只有 PENDING 的记录才退还积分
      const updateResult = await db.update(imageToolRecords)
        .set({
          status: 'FAILURE',
          error: task.failMsg || 'Processing failed',
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(imageToolRecords.taskId, taskId),
            eq(imageToolRecords.status, 'PENDING')
          )
        )
        .returning();

      if (updateResult.length > 0 && record.creditsUsed > 0) {
        try {
          await refundCreditsSimple(
            record.userId,
            record.creditsUsed,
            ProductType.IMAGE_TOOL,
            `Image tool failed (polling): ${task.failMsg || 'Unknown error'}`,
            record.taskId
          );
          console.log(`💰 [getImageToolTaskStatus] 积分已返还: ${record.creditsUsed}`);
        } catch (refundError) {
          console.error(`❌ [getImageToolTaskStatus] 积分返还失败:`, refundError);
        }
      }

      return { status: 'FAILURE', error: task.failMsg || 'Processing failed' };
    }

    // 仍在处理中
    return { status: 'PROCESSING' };
  } catch (error) {
    console.error('❌ [getImageToolTaskStatus] Error:', error);
    return {
      status: 'FAILURE',
      error: error instanceof Error ? error.message : 'Failed to get task status',
    };
  }
}

/**
 * 下载结果图片并上传到 R2
 */
async function downloadResultToR2(
  url: string,
  taskId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载图片: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ct = response.headers.get('content-type') || 'image/png';
    const ext = ct.includes('jpeg') || ct.includes('jpg') ? 'jpg' : 'png';
    const fileName = `${taskId}_result.${ext}`;
    const r2Url = await uploadImage(buffer, fileName, ct, `image-tools/${userId}`);
    console.log(`✅ [R2 Upload] 图片上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}
