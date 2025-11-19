/**
 * 服务端认证工具函数
 *
 * 用于 Server Actions 中验证用户身份
 * 支持 Auth.js 正式用户和设备指纹匿名用户
 */
import { headers } from 'next/headers';
import { auth } from './auth-next';
import prisma from './prisma';
import crypto from 'crypto';

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface UnifiedUser {
  user_id: string;
  is_anonymous: boolean;
}

// 匿名用户默认积分
const DEFAULT_ANONYMOUS_CREDITS = 1000;

// 匿名用户过期天数
const ANONYMOUS_USER_EXPIRY_DAYS = 30;

/**
 * 获取当前登录用户 (Auth.js)
 *
 * @throws Error 如果未登录
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('未登录');
  }

  // 获取应用用户 ID
  const authUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { appUserId: true },
  });

  return {
    uid: authUser?.appUserId || session.user.id!,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    picture: session.user.image ?? undefined,
  };
}

/**
 * 获取当前用户（可选）
 *
 * 如果用户未登录，返回 null 而不是抛出错误
 */
export async function getOptionalUser(): Promise<AuthUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * 创建或获取匿名用户
 *
 * 基于设备指纹创建或返回现有匿名用户
 */
async function createOrGetAnonymousUser(
  deviceFingerprint: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user_id: string; credits: number }> {
  // 生成匿名用户 ID
  const hash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex').substring(0, 16);
  const anonymousUserId = `anonymous_${hash}`;

  // 查找现有匿名用户
  let anonUser = await prisma.anonymous_users.findUnique({
    where: { user_id: anonymousUserId },
  });

  if (anonUser) {
    // 更新最后使用时间
    await prisma.anonymous_users.update({
      where: { user_id: anonymousUserId },
      data: {
        last_used_at: new Date(),
        ip_address: ipAddress || anonUser.ip_address,
        user_agent: userAgent || anonUser.user_agent,
      },
    });

    console.log(`📱 匿名用户访问: ${anonymousUserId}, 积分: ${anonUser.credits}`);
    return { user_id: anonUser.user_id, credits: anonUser.credits };
  }

  // 创建新匿名用户
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ANONYMOUS_USER_EXPIRY_DAYS);

  anonUser = await prisma.anonymous_users.create({
    data: {
      user_id: anonymousUserId,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      credits: DEFAULT_ANONYMOUS_CREDITS,
      total_credits_used: 0,
      is_anonymous: true,
      expires_at: expiresAt,
      last_used_at: new Date(),
    },
  });

  console.log(`✅ 新匿名用户创建: ${anonymousUserId}, 初始积分: ${DEFAULT_ANONYMOUS_CREDITS}`);
  return { user_id: anonUser.user_id, credits: anonUser.credits };
}

/**
 * 获取统一用户（支持正式用户和匿名用户）
 *
 * 优先使用 Auth.js Session，其次使用设备指纹
 *
 * @throws Error 如果既没有 session 也没有设备指纹
 */
export async function getUserOrAnonymous(): Promise<UnifiedUser> {
  // 1. 尝试获取正式用户 (Auth.js)
  const session = await auth();
  console.log('🔍 [getUserOrAnonymous] Session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });

  if (session?.user) {
    // 获取应用用户 ID
    const authUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { appUserId: true },
    });

    console.log('🔍 [getUserOrAnonymous] Auth User:', {
      hasAuthUser: !!authUser,
      appUserId: authUser?.appUserId,
    });

    const userId = authUser?.appUserId || session.user.id!;
    return {
      user_id: userId,
      is_anonymous: false,
    };
  }

  // 2. 尝试获取匿名用户
  const headersList = await headers();
  const fingerprint = headersList.get('x-device-fingerprint');

  console.log('🔍 [getUserOrAnonymous] Fingerprint:', fingerprint);

  if (fingerprint) {
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || undefined;
    const userAgent = headersList.get('user-agent') || undefined;

    const anonUser = await createOrGetAnonymousUser(fingerprint, ipAddress, userAgent);

    return {
      user_id: anonUser.user_id,
      is_anonymous: true,
    };
  }

  throw new Error('未提供认证信息');
}

/**
 * 要求用户登录的装饰器
 *
 * 用于 Server Actions 中验证用户身份
 */
export function requireAuth<T extends unknown[], R>(
  action: (user: AuthUser, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    const user = await getCurrentUser();
    return action(user, ...args);
  };
}
