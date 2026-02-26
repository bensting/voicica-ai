'use server';

import { getDb } from '@/lib/db';
import { userEvents } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

export type ReportReason =
  | 'copyright'
  | 'illegal'
  | 'inappropriate'
  | 'offensive'
  | 'spam'
  | 'other';

interface ReportContentParams {
  contentType: 'music' | 'video' | 'image' | 'tts' | 'dialogue';
  contentId: string;
  reason: ReportReason;
}

interface ReportResult {
  success: boolean;
  alreadyReported?: boolean;
  error?: string;
}

/**
 * 举报内容
 * - 保存到 user_events 表
 * - 无需登录，匿名用户也可举报
 * - 同用户同内容只记录一次
 */
export async function reportContent(params: ReportContentParams): Promise<ReportResult> {
  const db = await getDb();
  try {
    const { contentType, contentId, reason } = params;
    const eventName = `report_${contentType}`;

    // 获取用户（已登录或匿名用户都有唯一 ID）
    const user = await getUserOrAnonymous();
    const userId = user.user_id;

    // 检查是否已举报过（同用户同内容）
    const [existingReport] = await db
      .select()
      .from(userEvents)
      .where(
        and(
          eq(userEvents.userId, userId),
          eq(userEvents.event, eventName),
          sql`${userEvents.data}->>'content_id' = ${contentId}`
        )
      )
      .limit(1);

    if (existingReport) {
      return { success: true, alreadyReported: true };
    }

    // 保存举报记录
    await db.insert(userEvents).values({
      userId,
      event: eventName,
      data: {
        content_id: contentId,
        content_type: contentType,
        reason: reason,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Report content error:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}
