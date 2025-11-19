'use server';

/**
 * 用户模块 Server Actions
 */
import { getDb } from '@/lib/db';
import { users, anonymousUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, getUserOrAnonymous } from '@/lib/auth';
import type { UserProfile, CreditsInfo } from '@/types/user';

/**
 * 获取当前用户资料
 *
 * 需要认证，首次登录自动注册
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const authUser = await getCurrentUser();
  const db = await getDb();

  // 查找或创建用户
  let user = await db.query.users.findFirst({
    where: eq(users.userId, authUser.uid),
  });

  if (!user) {
    // 首次登录，自动创建用户
    const result = await db
      .insert(users)
      .values({
        userId: authUser.uid,
        email: authUser.email || null,
        name: authUser.name || null,
        photoUrl: authUser.picture || null,
        credits: 0,
        totalCreditsUsed: 0,
      })
      .returning();

    user = result[0];
    console.log(`新用户注册: ${authUser.uid}`);
  }

  return {
    id: user.id,
    user_id: user.userId,
    email: user.email,
    name: user.name,
    photo_url: user.photoUrl,
    credits: user.credits,
    total_credits_used: user.totalCreditsUsed,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 更新当前用户资料
 */
export async function updateUserProfile(data: {
  name?: string;
  photo_url?: string;
}): Promise<UserProfile> {
  const authUser = await getCurrentUser();
  const db = await getDb();

  const result = await db
    .update(users)
    .set({
      name: data.name,
      photoUrl: data.photo_url,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, authUser.uid))
    .returning();

  const user = result[0];

  return {
    id: user.id,
    user_id: user.userId,
    email: user.email,
    name: user.name,
    photo_url: user.photoUrl,
    credits: user.credits,
    total_credits_used: user.totalCreditsUsed,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 获取用户积分（仅积分信息）
 */
export async function getUserCredits(): Promise<{ credits: number; total_used: number }> {
  const authUser = await getCurrentUser();
  const db = await getDb();

  const user = await db.query.users.findFirst({
    where: eq(users.userId, authUser.uid),
    columns: { credits: true, totalCreditsUsed: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  return {
    credits: user.credits,
    total_used: user.totalCreditsUsed,
  };
}

/**
 * 获取用户资料（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedUserProfile(): Promise<UserProfile> {
  const unifiedUser = await getUserOrAnonymous();
  const db = await getDb();

  if (unifiedUser.is_anonymous) {
    // 匿名用户
    const anonUser = await db.query.anonymousUsers.findFirst({
      where: eq(anonymousUsers.userId, unifiedUser.user_id),
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      id: anonUser.id,
      user_id: anonUser.userId,
      email: null,
      name: null,
      photo_url: null,
      credits: anonUser.credits,
      total_credits_used: anonUser.totalCreditsUsed,
      is_anonymous: true,
      expires_at: anonUser.expiresAt?.toISOString() || null,
    };
  } else {
    // 正式用户
    const user = await db.query.users.findFirst({
      where: eq(users.userId, unifiedUser.user_id),
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      user_id: user.userId,
      email: user.email,
      name: user.name,
      photo_url: user.photoUrl,
      credits: user.credits,
      total_credits_used: user.totalCreditsUsed,
      is_anonymous: false,
      expires_at: null,
    };
  }
}

/**
 * 获取积分余额（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedCredits(): Promise<CreditsInfo> {
  const unifiedUser = await getUserOrAnonymous();
  const db = await getDb();

  if (unifiedUser.is_anonymous) {
    const anonUser = await db.query.anonymousUsers.findFirst({
      where: eq(anonymousUsers.userId, unifiedUser.user_id),
      columns: {
        credits: true,
        totalCreditsUsed: true,
        expiresAt: true,
      },
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      credits: anonUser.credits,
      total_used: anonUser.totalCreditsUsed,
      is_anonymous: true,
      expires_at: anonUser.expiresAt?.toISOString() || null,
    };
  } else {
    const user = await db.query.users.findFirst({
      where: eq(users.userId, unifiedUser.user_id),
      columns: {
        credits: true,
        totalCreditsUsed: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      credits: user.credits,
      total_used: user.totalCreditsUsed,
      is_anonymous: false,
      expires_at: null,
    };
  }
}