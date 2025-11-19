/**
 * 服务端认证工具函数
 *
 * 用于 Server Actions 中验证用户身份
 */
import { cookies, headers } from 'next/headers';
import { auth } from './firebase-admin';

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

/**
 * 获取当前登录用户
 *
 * 从 cookie 中获取 Firebase ID Token 并验证
 *
 * @throws Error 如果未登录或 token 无效
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-token')?.value;

  if (!token) {
    throw new Error('未登录');
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('Token 验证失败:', error);
    throw new Error('Token 无效或已过期');
  }
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
 * 获取统一用户（支持正式用户和匿名用户）
 *
 * 优先使用 Firebase Token，其次使用设备指纹
 *
 * @throws Error 如果既没有 token 也没有设备指纹
 */
export async function getUserOrAnonymous(): Promise<UnifiedUser> {
  // 尝试获取正式用户
  const user = await getOptionalUser();
  if (user) {
    return {
      user_id: user.uid,
      is_anonymous: false,
    };
  }

  // 尝试获取匿名用户
  const headersList = await headers();
  const fingerprint = headersList.get('x-device-fingerprint');

  if (fingerprint) {
    // 生成匿名用户 ID
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
    const anonymousUserId = `anonymous_${hash}`;

    return {
      user_id: anonymousUserId,
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
