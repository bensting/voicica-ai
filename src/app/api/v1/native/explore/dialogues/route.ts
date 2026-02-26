/**
 * Native App Explore Dialogues API
 *
 * GET /api/v1/native/explore/dialogues
 * 获取公开 Dialogue 对话列表（无需登录）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dialogueRecords, users } from '@/db/schema';
import { and, eq, desc, isNotNull, count, inArray } from 'drizzle-orm';

/**
 * 脱敏邮箱
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

/**
 * 从 dialogueJson 中提取角色名和首句文本
 */
function parseDialogueSummary(dialogueJson: string): { speakerNames: string[]; previewText: string } {
  try {
    const dialogue: Array<{ text: string; voice: string }> = JSON.parse(dialogueJson);
    const speakerNames = [...new Set(dialogue.map((d) => d.voice))];
    const previewText = dialogue.length > 0 ? dialogue[0].text : '';
    return { speakerNames, previewText };
  } catch {
    return { speakerNames: [], previewText: '' };
  }
}

export async function GET(req: NextRequest) {
  const db = await getDb();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const whereCondition = and(
      eq(dialogueRecords.isPublic, true),
      eq(dialogueRecords.status, 'SUCCESS'),
      isNotNull(dialogueRecords.audioUrl),
    );

    // 查询公开且成功的 Dialogue 记录
    const [records, [{ total }]] = await Promise.all([
      db.select({
        id: dialogueRecords.id,
        taskId: dialogueRecords.taskId,
        userId: dialogueRecords.userId,
        dialogueJson: dialogueRecords.dialogueJson,
        totalCharacters: dialogueRecords.totalCharacters,
        duration: dialogueRecords.duration,
        audioUrl: dialogueRecords.audioUrl,
        createdAt: dialogueRecords.createdAt,
      })
        .from(dialogueRecords)
        .where(whereCondition)
        .orderBy(desc(dialogueRecords.createdAt))
        .offset(skip)
        .limit(limit),
      db.select({ total: count() })
        .from(dialogueRecords)
        .where(whereCondition),
    ]);

    // 获取用户邮箱（批量查询）
    const userIds = [...new Set(records.map((r) => r.userId))];
    const userList = userIds.length > 0
      ? await db.select({ userId: users.userId, email: users.email })
          .from(users)
          .where(inArray(users.userId, userIds))
      : [];
    const userMap = new Map(userList.map((u) => [u.userId, u.email]));

    const response = NextResponse.json({
      success: true,
      dialogues: records.map((r) => {
        const { speakerNames, previewText } = parseDialogueSummary(r.dialogueJson);
        return {
          id: r.id,
          taskId: r.taskId,
          dialogueJson: r.dialogueJson,
          totalCharacters: r.totalCharacters,
          duration: r.duration,
          audioUrl: r.audioUrl,
          user: maskEmail(userMap.get(r.userId) || null),
          createdAt: r.createdAt,
          speakerNames,
          previewText,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // CDN 缓存 10 分钟
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

    return response;
  } catch (error) {
    console.error('❌ [Explore] 获取公开对话列表失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get public dialogues',
      },
      { status: 500 }
    );
  }
}
