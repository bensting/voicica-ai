'use server';

import { getDb } from '@/lib/db';
import { deviceTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

/**
 * 注册/更新设备 FCM token
 * 支持已登录用户和匿名用户
 * 相同 token 更新 userId（用户登录/切换账号时自动关联）
 */
export async function registerDeviceToken(token: string, platform: string) {
  const user = await getUserOrAnonymous();
  const db = await getDb();

  const now = new Date().toISOString();

  await db.insert(deviceTokens)
    .values({
      userId: user.user_id,
      token,
      platform,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: { userId: user.user_id, updatedAt: now },
    });
}

/**
 * 删除设备 token（用户登出时调用）
 */
export async function removeDeviceToken(token: string) {
  const db = await getDb();
  await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
}
