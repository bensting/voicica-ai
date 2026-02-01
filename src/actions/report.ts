'use server';

import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

export type ReportReason =
  | 'copyright'
  | 'illegal'
  | 'inappropriate'
  | 'offensive'
  | 'spam'
  | 'other';

interface ReportContentParams {
  contentType: 'music' | 'video' | 'image' | 'tts';
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
  try {
    const { contentType, contentId, reason } = params;
    const eventName = `report_${contentType}`;

    // 获取用户（已登录或匿名用户都有唯一 ID）
    const user = await getUserOrAnonymous();
    const userId = user.user_id;

    // 检查是否已举报过（同用户同内容）
    const existingReport = await prisma.user_events.findFirst({
      where: {
        user_id: userId,
        event: eventName,
        data: {
          path: ['content_id'],
          equals: contentId,
        },
      },
    });

    if (existingReport) {
      return { success: true, alreadyReported: true };
    }

    // 保存举报记录
    await prisma.user_events.create({
      data: {
        user_id: userId,
        event: eventName,
        data: {
          content_id: contentId,
          content_type: contentType,
          reason: reason,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Report content error:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}
