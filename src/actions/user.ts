'use server';

/**
 * 用户模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getCurrentUser, getUserOrAnonymous } from '@/lib/auth-firebase';
import type { UserProfile, CreditsInfo } from '@/types/user';

/**
 * 获取当前用户资料
 *
 * 需要认证，首次登录自动注册
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const authUser = await getCurrentUser();

  // 查找或创建用户
  let user = await prisma.users.findUnique({
    where: { user_id: authUser.uid },
  });

  if (!user) {
    // 首次登录，自动创建用户
    user = await prisma.users.create({
      data: {
        user_id: authUser.uid,
        email: authUser.email || null,
        name: authUser.name || null,
        photo_url: authUser.picture || null,
        credits: 0,
        total_credits_used: 0,
      },
    });
    console.log(`新用户注册: ${authUser.uid}`);
  }

  return {
    id: user.id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    photo_url: user.photo_url,
    credits: user.credits,
    total_credits_used: user.total_credits_used,
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

  const user = await prisma.users.update({
    where: { user_id: authUser.uid },
    data: {
      name: data.name,
      photo_url: data.photo_url,
      updated_at: new Date(),
    },
  });

  return {
    id: user.id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    photo_url: user.photo_url,
    credits: user.credits,
    total_credits_used: user.total_credits_used,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 获取用户积分（仅积分信息）
 */
export async function getUserCredits(): Promise<{ credits: number; total_used: number }> {
  const authUser = await getCurrentUser();

  const user = await prisma.users.findUnique({
    where: { user_id: authUser.uid },
    select: { credits: true, total_credits_used: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  return {
    credits: user.credits,
    total_used: user.total_credits_used,
  };
}

/**
 * 获取用户资料（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedUserProfile(): Promise<UserProfile> {
  const unifiedUser = await getUserOrAnonymous();

  if (unifiedUser.is_anonymous) {
    // 匿名用户
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      id: anonUser.id,
      user_id: anonUser.user_id,
      email: null,
      name: null,
      photo_url: null,
      credits: anonUser.credits,
      total_credits_used: anonUser.total_credits_used,
      is_anonymous: true,
      expires_at: anonUser.expires_at?.toISOString() || null,
    };
  } else {
    // 正式用户
    const user = await prisma.users.findUnique({
      where: { user_id: unifiedUser.user_id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      photo_url: user.photo_url,
      credits: user.credits,
      total_credits_used: user.total_credits_used,
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

  if (unifiedUser.is_anonymous) {
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: {
        credits: true,
        total_credits_used: true,
        expires_at: true,
      },
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      credits: anonUser.credits,
      total_used: anonUser.total_credits_used,
      is_anonymous: true,
      expires_at: anonUser.expires_at?.toISOString() || null,
    };
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: {
        credits: true,
        total_credits_used: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      credits: user.credits,
      total_used: user.total_credits_used,
      is_anonymous: false,
      expires_at: null,
    };
  }
}
