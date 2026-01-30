import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadAudio, uploadImage } from '@/lib/services/r2-storage';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

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

/**
 * 从 URL 下载文件并上传到 R2
 */
async function downloadAndUploadToR2(
  url: string,
  taskId: string,
  type: 'audio' | 'cover',
  trackIndex: number = 1
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载文件: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const suffix = trackIndex > 1 ? `_v${trackIndex}` : '';

    if (type === 'audio') {
      const fileName = `${taskId}${suffix}.mp3`;
      const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'music_audio');
      console.log(`✅ [R2 Upload] 音频上传成功: ${r2Url}`);
      return r2Url;
    } else {
      const fileName = `${taskId}${suffix}.jpg`;
      const r2Url = await uploadImage(buffer, fileName, 'image/jpeg', 'music_covers');
      console.log(`✅ [R2 Upload] 封面上传成功: ${r2Url}`);
      return r2Url;
    }
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

/**
 * 处理音轨数据，下载并上传到 R2
 */
async function processTrackData(
  track: KieCallbackData,
  taskId: string,
  trackIndex: number
): Promise<{
  track_id: string | null;
  audio_url: string | null;
  cover_url: string | null;
  stream_url: string | null;
  duration: number | null;
  title: string | null;
  tags: string | null;
  lyrics: string | null;
}> {
  // 下载音频到 R2
  const r2AudioUrl = track.audio_url
    ? await downloadAndUploadToR2(track.audio_url, taskId, 'audio', trackIndex)
    : null;

  // 下载封面到 R2
  const r2CoverUrl = track.image_url
    ? await downloadAndUploadToR2(track.image_url, taskId, 'cover', trackIndex)
    : null;

  return {
    track_id: track.id || null, // KIE 回调返回的歌曲 id
    audio_url: r2AudioUrl || track.audio_url, // 如果 R2 上传失败，保留原始 URL
    cover_url: r2CoverUrl || track.image_url || null,
    stream_url: track.stream_audio_url || null,
    duration: track.duration || null,
    title: track.title || null,
    tags: track.tags || null,
    lyrics: track.prompt || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: KieCallbackPayload = await request.json();

    console.log('🎵 [KIE Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🎵 [KIE Callback] 回调错误:', payload.msg);

      // 尝试根据 task_id 更新记录状态并返还积分（使用乐观锁防止重复）
      if (payload.data?.task_id) {
        const failedRecord = await prisma.music_records.findFirst({
          where: { external_task_id: payload.data.task_id },
        });

        if (failedRecord) {
          const updateResult = await prisma.music_records.updateMany({
            where: {
              id: failedRecord.id,
              status: 'PROCESSING', // 乐观锁：防止重复处理
            },
            data: {
              status: 'FAILURE',
              error_message: payload.msg || 'Generation failed',
            },
          });

          // 如果更新成功（count > 0），说明是第一个处理的，需要返还积分
          if (updateResult.count > 0 && failedRecord.credits_cost && failedRecord.credits_cost > 0) {
            try {
              await refundCreditsSimple(
                failedRecord.user_id,
                failedRecord.credits_cost,
                ProductType.AI_MUSIC,
                `Music generation failed (KIE callback error): ${payload.msg || 'Unknown error'}`,
                failedRecord.task_id
              );
              console.log(`💰 [KIE Callback] 积分已返还: ${failedRecord.credits_cost}`);
            } catch (refundError) {
              console.error(`❌ [KIE Callback] 积分返还失败:`, refundError);
            }
          } else if (updateResult.count === 0) {
            console.log(`⚠️ [KIE Callback] 任务已被其他请求处理，跳过: ${failedRecord.task_id}`);
          }
        }
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
        // 第一首歌曲完成，更新进度（不下载，等 complete 时一起下载）
        if (tracks && tracks.length > 0) {
          await prisma.music_records.update({
            where: { id: record.id },
            data: {
              progress: 70,
            },
          });
          console.log(`🎵 [KIE Callback] 第一首歌曲完成: ${record.task_id}`);
        }
        break;

      case 'complete':
        // 所有歌曲完成，下载文件到 R2
        if (tracks && tracks.length > 0) {
          console.log(`🎵 [KIE Callback] 开始处理 ${tracks.length} 首歌曲，下载到 R2...`);

          // 处理第一首歌
          const firstTrackData = await processTrackData(tracks[0], record.task_id, 1);

          // 处理第二首歌（如果有）
          let secondTrackData: Awaited<ReturnType<typeof processTrackData>> | null = null;
          if (tracks.length > 1) {
            secondTrackData = await processTrackData(tracks[1], record.task_id, 2);
          }

          await prisma.music_records.update({
            where: { id: record.id },
            data: {
              status: 'SUCCESS',
              progress: 100,
              // 第一首歌
              external_track_id: firstTrackData.track_id,
              audio_url: firstTrackData.audio_url,
              stream_url: firstTrackData.stream_url,
              cover_url: firstTrackData.cover_url,
              duration: firstTrackData.duration,
              // 第二首歌（如果有）
              external_track_id_2: secondTrackData?.track_id || null,
              audio_url_2: secondTrackData?.audio_url || null,
              stream_url_2: secondTrackData?.stream_url || null,
              cover_url_2: secondTrackData?.cover_url || null,
              duration_2: secondTrackData?.duration || null,
              // 元数据
              title: firstTrackData.title || record.title,
              tags: firstTrackData.tags || null,
              lyrics: firstTrackData.lyrics || record.lyrics,
              completed_at: new Date(),
            },
          });
          console.log(`🎵 [KIE Callback] 所有歌曲处理完成: ${record.task_id}, 共 ${tracks.length} 首, track_ids: [${firstTrackData.track_id}, ${secondTrackData?.track_id || 'N/A'}]`);
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
