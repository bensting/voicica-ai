/**
 * Native App Explore Voices API
 *
 * GET /api/v1/native/explore/voices
 * 获取公开 TTS 语音列表（无需登录）
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 脱敏邮箱
 * example@gmail.com -> ex****@gmail...
 */
function maskEmail(email: string | null): string {
  if (!email) return 'Anonymous';

  const atIndex = email.indexOf('@');
  if (atIndex <= 2) {
    return email.substring(0, 1) + '****@' + email.substring(atIndex + 1, atIndex + 6) + '...';
  }

  const prefix = email.substring(0, 2);
  const domain = email.substring(atIndex + 1);
  const domainPreview = domain.length > 5 ? domain.substring(0, 5) + '...' : domain;

  return `${prefix}****@${domainPreview}`;
}

export async function GET(req: NextRequest) {
  try {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 查询公开且成功的 TTS 记录
    const [ttsRecords, total] = await Promise.all([
      prisma.tts_records.findMany({
        where: {
          is_public: true,
          status: 'SUCCESS',
          audio_url: { not: null },
        },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          text: true,
          voice_name: true,
          language: true,
          duration: true,
          audio_url: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tts_records.count({
        where: {
          is_public: true,
          status: 'SUCCESS',
          audio_url: { not: null },
        },
      }),
    ]);

    // 获取用户邮箱（批量查询）
    const userIds = [...new Set(ttsRecords.map((v) => v.user_id))];
    const users = await prisma.users.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.user_id, u.email]));

    // 获取 voice 详情（批量查询）
    const voiceNames = [...new Set(ttsRecords.map((v) => v.voice_name))];
    const voiceDetails = await prisma.voices.findMany({
      where: { name: { in: voiceNames } },
      select: {
        name: true,
        display_name: true,
        avatar_url: true,
        gender: true,
        provider: true,
        locale: true,
        country: true,
      },
    });
    const voiceMap = new Map(voiceDetails.map((v) => [v.name, v]));

    const response = NextResponse.json({
      success: true,
      voices: ttsRecords.map((v) => {
        const voice = voiceMap.get(v.voice_name);
        return {
          id: v.id,
          taskId: v.task_id,
          text: v.text,
          voiceName: v.voice_name,
          language: v.language,
          duration: v.duration,
          audioUrl: v.audio_url,
          user: maskEmail(userMap.get(v.user_id) || null),
          createdAt: v.created_at?.toISOString(),
          // Voice details
          voice: voice ? {
            displayName: voice.display_name,
            avatarUrl: voice.avatar_url,
            gender: voice.gender,
            provider: voice.provider,
            locale: voice.locale,
            country: voice.country,
          } : null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // 添加缓存：10分钟 CDN 缓存，1小时 stale-while-revalidate
    // 由于 voices 数据不常变化，使用较长的缓存时间
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

    return response;
  } catch (error) {
    console.error('❌ [Explore] 获取公开语音列表失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get public voices',
      },
      { status: 500 }
    );
  }
}
