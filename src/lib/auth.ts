/**
 * 服务端认证工具函数
 *
 * 用于 Server Actions 中验证用户身份
 * 支持 Auth.js 正式用户和设备指纹匿名用户
 */
import { headers } from 'next/headers';
import { auth } from './auth-next';
import { getDb, anonymousUsers } from './db';
import { eq } from 'drizzle-orm';

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

  // 从 session 获取 appUserId (JWT 模式下已经在 token 中)
  const extendedUser = session.user as { id?: string; appUserId?: string };
  const userId = extendedUser.appUserId || extendedUser.id!;

  return {
    uid: userId,
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
  const db = await getDb();

  // 生成匿名用户 ID (使用 Web Crypto API)
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceFingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  const anonymousUserId = `anonymous_${hash}`;

  // 查找现有匿名用户
  const anonUser = await db.query.anonymousUsers.findFirst({
    where: eq(anonymousUsers.userId, anonymousUserId),
  });

  if (anonUser) {
    // 更新最后使用时间
    await db.update(anonymousUsers)
      .set({
        lastUsedAt: new Date(),
        ipAddress: ipAddress || anonUser.ipAddress,
        userAgent: userAgent || anonUser.userAgent,
      })
      .where(eq(anonymousUsers.userId, anonymousUserId));

    console.log(`📱 匿名用户访问: ${anonymousUserId}, 积分: ${anonUser.credits}`);
    return { user_id: anonUser.userId, credits: anonUser.credits };
  }

  // 创建新匿名用户
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ANONYMOUS_USER_EXPIRY_DAYS);

  const result = await db.insert(anonymousUsers).values({
    userId: anonymousUserId,
    deviceFingerprint: deviceFingerprint,
    ipAddress: ipAddress,
    userAgent: userAgent,
    credits: DEFAULT_ANONYMOUS_CREDITS,
    totalCreditsUsed: 0,
    isAnonymous: true,
    expiresAt: expiresAt,
    lastUsedAt: new Date(),
  }).returning();

  const newUser = result[0];
  console.log(`✅ 新匿名用户创建: ${anonymousUserId}, 初始积分: ${DEFAULT_ANONYMOUS_CREDITS}`);
  return { user_id: newUser.userId, credits: newUser.credits };
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
  if (session?.user) {
    const extendedUser = session.user as { id?: string; appUserId?: string };
    const userId = extendedUser.appUserId || extendedUser.id!;

    return {
      user_id: userId,
      is_anonymous: false,
    };
  }

  // 2. 尝试获取匿名用户
  const headersList = await headers();
  const fingerprint = headersList.get('x-device-fingerprint');

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