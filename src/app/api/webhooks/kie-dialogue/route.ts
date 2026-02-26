import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dialogueRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { uploadAudio } from '@/lib/services/r2-storage';

/**
 * KIE API Dialogue 生成回调处理
 * ElevenLabs text-to-dialogue-v3
 */

interface KieDialogueCallbackPayload {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: 'success' | 'fail' | 'waiting' | 'queuing' | 'generating';
    resultJson?: string; // JSON string: { resultUrls: ["..."] }
    failCode?: string;
    failMsg?: string;
  };
}

/**
 * 从 URL 下载音频并上传到 R2
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

export async function POST(request: NextRequest) {
  const db = await getDb();
  try {
    const payload: KieDialogueCallbackPayload = await request.json();

    console.log('🎭 [KIE Dialogue Callback] 收到回调:', JSON.stringify(payload, null, 2));

    const { taskId: externalTaskId, state, resultJson, failMsg } = payload.data || {};

    if (!externalTaskId) {
      console.error('🎭 [KIE Dialogue Callback] 缺少 taskId');
      return NextResponse.json({ success: false, error: 'Missing taskId' });
    }

    // 查找对应的记录
    const [record] = await db
      .select()
      .from(dialogueRecords)
      .where(eq(dialogueRecords.externalTaskId, externalTaskId))
      .limit(1);

    if (!record) {
      console.warn(`🎭 [KIE Dialogue Callback] 找不到对应记录: ${externalTaskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🎭 [KIE Dialogue Callback] state: ${state}, 记录ID: ${record.taskId}`);

    if (state === 'success' && resultJson) {
      // 解析结果获取音频 URL
      let audioUrl: string | null = null;
      try {
        const resultData = JSON.parse(resultJson);
        const originalUrl = resultData.resultUrls?.[0] || resultData.audio_url;

        if (originalUrl) {
          // 下载并上传到 R2
          audioUrl = await downloadAndUploadToR2(originalUrl, record.taskId);
          // 如果 R2 上传失败，使用原始 URL
          if (!audioUrl) {
            audioUrl = originalUrl;
          }
        }
      } catch (e) {
        console.error('🎭 [KIE Dialogue Callback] 解析 resultJson 失败:', e);
      }

      await db
        .update(dialogueRecords)
        .set({
          status: 'SUCCESS',
          progress: 100,
          audioUrl: audioUrl,
          completedAt: new Date().toISOString(),
        })
        .where(eq(dialogueRecords.id, record.id));
      console.log(`🎭 [KIE Dialogue Callback] Dialogue 生成成功: ${record.taskId}`);
    } else if (state === 'fail') {
      await db
        .update(dialogueRecords)
        .set({
          status: 'FAILURE',
          errorMessage: failMsg || 'Generation failed',
        })
        .where(eq(dialogueRecords.id, record.id));
      console.log(`🎭 [KIE Dialogue Callback] Dialogue 生成失败: ${record.taskId}, ${failMsg}`);
    } else if (state === 'generating' || state === 'queuing') {
      // 更新进度
      const progress = state === 'queuing' ? 30 : 60;
      await db
        .update(dialogueRecords)
        .set({
          status: 'PROCESSING',
          progress,
        })
        .where(eq(dialogueRecords.id, record.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🎭 [KIE Dialogue Callback] 处理错误:', error);
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
    endpoint: 'KIE Dialogue Webhook',
    timestamp: new Date().toISOString(),
  });
}
