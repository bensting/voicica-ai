import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadAudio } from '@/lib/services/r2-storage';

/**
 * Replicate API Cover 回调处理
 * 处理 zsxkib/realistic-voice-cloning 模型的回调
 *
 * 查询参数：
 * - task_id: Cover 任务 ID
 */

// Replicate Webhook 回调数据结构
interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  error?: string;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * 从 Replicate URL 下载并上传到 R2
 */
async function downloadAndUploadToR2(
  url: string,
  taskId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载 Cover 文件: ${url.substring(0, 80)}...`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${taskId}.mp3`;
    const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'cover_audio');

    console.log(`✅ [R2 Upload] Cover 上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] Cover 上传失败:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      console.error('🎤 [Replicate Callback] 缺少 task_id 参数');
      return NextResponse.json({ success: false, error: 'Missing task_id' }, { status: 400 });
    }

    // 解析 Replicate 回调数据
    const prediction: ReplicatePrediction = await request.json();

    console.log(`🎤 [Replicate Callback] 收到回调:`, {
      taskId,
      predictionId: prediction.id,
      status: prediction.status,
    });

    // 查找对应的 Cover 记录
    const record = await prisma.cover_records.findUnique({
      where: { task_id: taskId },
    });

    if (!record) {
      console.warn(`🎤 [Replicate Callback] 找不到对应记录: ${taskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    // 处理回调结果
    if (prediction.status === 'succeeded') {
      // 成功 - 获取输出 URL
      const replicateOutputUrl = prediction.output as string;

      console.log(`🎤 [Replicate Callback] 任务成功，开始下载到 R2:`, {
        output: replicateOutputUrl?.substring(0, 50) + '...',
        predictTime: prediction.metrics?.predict_time,
      });

      // 下载到 R2
      const r2Url = await downloadAndUploadToR2(replicateOutputUrl, taskId);
      const finalUrl = r2Url || replicateOutputUrl; // 如果 R2 上传失败，保留原始 URL

      await prisma.cover_records.update({
        where: { task_id: taskId },
        data: {
          status: 'SUCCESS',
          progress: 100,
          output_url: finalUrl,
          completed_at: new Date(),
        },
      });

      console.log(`🎤 [Replicate Callback] Cover 任务完成: ${taskId}, URL: ${finalUrl.substring(0, 50)}...`);
    } else if (prediction.status === 'failed') {
      // 失败
      await prisma.cover_records.update({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error_message: prediction.error || 'AI Cover 处理失败',
        },
      });

      console.error(`🎤 [Replicate Callback] 任务失败:`, prediction.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🎤 [Replicate Callback] 处理错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于验证 endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Replicate Cover Webhook',
    timestamp: new Date().toISOString(),
  });
}
