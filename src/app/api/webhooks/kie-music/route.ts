import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * KIE API 音乐生成回调处理
 *
 * 回调类型：
 * - text: 歌词生成完成
 * - first: 第一首歌曲生成完成
 * - complete: 所有歌曲生成完成
 */

interface KieCallbackData {
  id: string;
  audio_url: string;
  stream_audio_url?: string;
  image_url?: string;
  prompt?: string;
  model_name?: string;
  title?: string;
  tags?: string;
  createTime?: string;
  duration?: number;
}

interface KieCallbackPayload {
  code: number;
  msg: string;
  data: {
    callbackType: 'text' | 'first' | 'complete';
    task_id: string;
    data: KieCallbackData[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: KieCallbackPayload = await request.json();

    console.log('🎵 [KIE Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🎵 [KIE Callback] 回调错误:', payload.msg);

      // 尝试根据 task_id 更新记录状态
      if (payload.data?.task_id) {
        await prisma.music_records.updateMany({
          where: { external_task_id: payload.data.task_id },
          data: {
            status: 'FAILURE',
            error_message: payload.msg || 'Generation failed',
          },
        });
      }

      return NextResponse.json({ success: false, error: payload.msg });
    }

    const { callbackType, task_id: externalTaskId, data: tracks } = payload.data;

    // 查找对应的记录
    const record = await prisma.music_records.findFirst({
      where: { external_task_id: externalTaskId },
    });

    if (!record) {
      console.warn(`🎵 [KIE Callback] 找不到对应记录: ${externalTaskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🎵 [KIE Callback] 回调类型: ${callbackType}, 记录ID: ${record.task_id}`);

    switch (callbackType) {
      case 'text':
        // 歌词生成完成，更新进度
        await prisma.music_records.update({
          where: { id: record.id },
          data: {
            progress: 30,
            lyrics: tracks[0]?.prompt || null,
          },
        });
        console.log(`🎵 [KIE Callback] 歌词生成完成: ${record.task_id}`);
        break;

      case 'first':
        // 第一首歌曲完成，更新进度和第一首歌曲数据
        if (tracks && tracks.length > 0) {
          const firstTrack = tracks[0];
          await prisma.music_records.update({
            where: { id: record.id },
            data: {
              progress: 70,
              audio_url: firstTrack.audio_url,
              stream_url: firstTrack.stream_audio_url || null,
              cover_url: firstTrack.image_url || null,
              duration: firstTrack.duration || null,
              title: firstTrack.title || record.title,
              tags: firstTrack.tags || null,
              lyrics: firstTrack.prompt || record.lyrics,
            },
          });
          console.log(`🎵 [KIE Callback] 第一首歌曲完成: ${record.task_id}`);
        }
        break;

      case 'complete':
        // 所有歌曲完成
        if (tracks && tracks.length > 0) {
          const firstTrack = tracks[0];
          const secondTrack = tracks.length > 1 ? tracks[1] : null;

          await prisma.music_records.update({
            where: { id: record.id },
            data: {
              status: 'SUCCESS',
              progress: 100,
              audio_url: firstTrack.audio_url,
              stream_url: firstTrack.stream_audio_url || null,
              cover_url: firstTrack.image_url || null,
              duration: firstTrack.duration || null,
              // 第二首歌曲（如果有）
              audio_url_2: secondTrack?.audio_url || null,
              stream_url_2: secondTrack?.stream_audio_url || null,
              cover_url_2: secondTrack?.image_url || null,
              duration_2: secondTrack?.duration || null,
              // 元数据
              title: firstTrack.title || record.title,
              tags: firstTrack.tags || null,
              lyrics: firstTrack.prompt || record.lyrics,
              completed_at: new Date(),
            },
          });
          console.log(`🎵 [KIE Callback] 所有歌曲生成完成: ${record.task_id}, 共 ${tracks.length} 首`);
        }
        break;

      default:
        console.warn(`🎵 [KIE Callback] 未知回调类型: ${callbackType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🎵 [KIE Callback] 处理错误:', error);
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
    endpoint: 'KIE Music Webhook',
    timestamp: new Date().toISOString(),
  });
}
