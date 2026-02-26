/**
 * Native App Explore Voices API
 *
 * GET /api/v1/native/explore/voices
 * 获取公开 TTS 语音列表（无需登录）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ttsRecords, users, voices } from '@/db/schema';
import { and, eq, desc, isNotNull, count, inArray } from 'drizzle-orm';

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
  const db = await getDb();
  try {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const whereCondition = and(
      eq(ttsRecords.isPublic, true),
      eq(ttsRecords.status, 'SUCCESS'),
      isNotNull(ttsRecords.audioUrl),
    );

    // 查询公开且成功的 TTS 记录
    const [records, [{ total }]] = await Promise.all([
      db.select({
        id: ttsRecords.id,
        taskId: ttsRecords.taskId,
        userId: ttsRecords.userId,
        text: ttsRecords.text,
        voiceName: ttsRecords.voiceName,
        language: ttsRecords.language,
        duration: ttsRecords.duration,
        audioUrl: ttsRecords.audioUrl,
        createdAt: ttsRecords.createdAt,
      })
        .from(ttsRecords)
        .where(whereCondition)
        .orderBy(desc(ttsRecords.createdAt))
        .offset(skip)
        .limit(limit),
      db.select({ total: count() })
        .from(ttsRecords)
        .where(whereCondition),
    ]);

    // 获取用户邮箱（批量查询）
    const userIds = [...new Set(records.map((v) => v.userId))];
    const userList = userIds.length > 0
      ? await db.select({ userId: users.userId, email: users.email })
          .from(users)
          .where(inArray(users.userId, userIds))
      : [];
    const userMap = new Map(userList.map((u) => [u.userId, u.email]));

    // 获取 voice 详情（批量查询）
    const voiceNames = [...new Set(records.map((v) => v.voiceName))];
    const voiceDetailList = voiceNames.length > 0
      ? await db.select({
          name: voices.name,
          displayName: voices.displayName,
          avatarUrl: voices.avatarUrl,
          gender: voices.gender,
          provider: voices.provider,
          locale: voices.locale,
          country: voices.country,
        })
          .from(voices)
          .where(inArray(voices.name, voiceNames))
      : [];
    const voiceMap = new Map(voiceDetailList.map((v) => [v.name, v]));

    const response = NextResponse.json({
      success: true,
      voices: records.map((v) => {
        const voice = voiceMap.get(v.voiceName);
        return {
          id: v.id,
          taskId: v.taskId,
          text: v.text,
          voiceName: v.voiceName,
          language: v.language,
          duration: v.duration,
          audioUrl: v.audioUrl,
          user: maskEmail(userMap.get(v.userId) || null),
          createdAt: v.createdAt,
          // Voice details
          voice: voice ? {
            displayName: voice.displayName,
            avatarUrl: voice.avatarUrl,
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
