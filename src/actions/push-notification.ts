'use server';

import { verifyAdmin } from '@/lib/auth-admin';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getDb } from '@/lib/db';
import { deviceTokens, pushNotificationLogs } from '@/db/schema';
import { sendPushToUser, sendPushToAll } from '@/lib/fcm-send';
import { count, sql, desc } from 'drizzle-orm';

/**
 * Admin: 发送推送通知（带历史记录）
 */
export async function adminSendPush(params: {
  target: 'all' | 'user';
  userId?: string;
  title: string;
  body: string;
}) {
  await verifyAdmin();
  const admin = await getCurrentUser();

  const { target, userId, title, body } = params;

  if (!title.trim() || !body.trim()) {
    throw new Error('标题和内容不能为空');
  }

  let result: { sent: number; failed: number; cleaned: number; total?: number };

  if (target === 'user') {
    if (!userId?.trim()) {
      throw new Error('请输入用户 ID');
    }
    result = await sendPushToUser(userId.trim(), title, body);
  } else {
    result = await sendPushToAll(title, body);
  }

  // 写入历史记录
  const db = await getDb();
  await db.insert(pushNotificationLogs).values({
    target,
    targetUserId: target === 'user' ? userId?.trim() : null,
    title,
    body,
    sentBy: admin.email || admin.uid,
    totalDevices: result.total ?? result.sent + result.failed,
    sentCount: result.sent,
    failedCount: result.failed,
  });

  const message = target === 'user'
    ? (result.sent > 0
        ? `已推送给用户 ${userId} 的 ${result.sent} 台设备`
        : `用户 ${userId} 没有注册设备`)
    : `广播完成：${result.sent}/${result.total} 台设备成功`;

  return { success: true, message, ...result };
}

/**
 * Admin: 获取推送统计
 */
export async function adminGetPushStats() {
  await verifyAdmin();

  const db = await getDb();

  const [
    [{ total: totalTokens }],
    platformStats,
  ] = await Promise.all([
    db.select({ total: count() }).from(deviceTokens),
    db.select({
      platform: deviceTokens.platform,
      count: count(),
    }).from(deviceTokens).groupBy(deviceTokens.platform),
  ]);

  const [{ total: uniqueUsers }] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${deviceTokens.userId})` })
    .from(deviceTokens);

  return {
    totalTokens: Number(totalTokens),
    uniqueUsers: Number(uniqueUsers),
    platforms: platformStats.map(p => ({
      platform: p.platform,
      count: Number(p.count),
    })),
  };
}

/**
 * Admin: 获取推送历史记录
 */
export async function adminGetPushHistory(page = 1, pageSize = 20) {
  await verifyAdmin();

  const db = await getDb();

  const [rows, [{ total }]] = await Promise.all([
    db.select()
      .from(pushNotificationLogs)
      .orderBy(desc(pushNotificationLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(pushNotificationLogs),
  ]);

  return {
    logs: rows,
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
  };
}
