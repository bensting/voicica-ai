/**
 * Firebase Auth 服务端认证工具函数
 *
 * 用于 Server Actions 中验证用户身份
 * 支持 Firebase 正式用户和设备指纹匿名用户
 */
import { headers } from 'next/headers';
import { auth as adminAuth } from './firebase-admin';
import prisma from './prisma';
import crypto from 'crypto';
import { appConfig } from '@/config/appConfig';

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
 * 从 HTTP Header 获取 Firebase ID Token 并验证
 *
 * @param headersList - Headers 对象（必须在调用侧获取）
 */
async function verifyFirebaseToken(headersList: Awaited<ReturnType<typeof headers>>): Promise<AuthUser | null> {
  try {
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证 Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(token);

    console.log('✅ [Firebase Auth] Token 验证成功:', decodedToken.uid);

    // 自动注册或更新用户
    await createOrUpdateFirebaseUser(decodedToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('❌ [Firebase Auth] Token 验证失败:', error);
    return null;
  }
}

/**
 * 创建或更新 Firebase 用户到数据库
 */
async function createOrUpdateFirebaseUser(decodedToken: {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<void> {
  const existingUser = await prisma.users.findUnique({
    where: { user_id: decodedToken.uid },
  });

  if (existingUser) {
    // 更新用户信息
    await prisma.users.update({
      where: { user_id: decodedToken.uid },
      data: {
        email: decodedToken.email || existingUser.email,
        name: decodedToken.name || existingUser.name,
        photo_url: decodedToken.picture || existingUser.photo_url,
        updated_at: new Date(),
      },
    });
    console.log(`🔄 [Firebase Auth] 用户信息已更新: ${decodedToken.uid}`);
  } else {
    // 创建新用户
    await prisma.users.create({
      data: {
        user_id: decodedToken.uid,
        email: decodedToken.email || `${decodedToken.uid}@firebase.user`,
        name: decodedToken.name || 'Firebase User',
        photo_url: decodedToken.picture,
        credits: appConfig.credits.registered_user,
        total_credits_used: 0,
      },
    });
    console.log(`✅ [Firebase Auth] 新用户已创建: ${decodedToken.uid}`);
  }
}

/**
 * 获取当前登录用户 (Firebase)
 *
 * @throws Error 如果未登录
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const headersList = await headers();
  const user = await verifyFirebaseToken(headersList);

  if (!user) {
    throw new Error('未登录');
  }

  return user;
}

/**
 * 获取当前用户（可选）
 *
 * 如果用户未登录，返回 null 而不是抛出错误
 */
export async function getOptionalUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  return await verifyFirebaseToken(headersList);
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
  expiresAt.setDate(expiresAt.getDate() + appConfig.anonymous_user.expiry_days);

  anonUser = await prisma.anonymous_users.create({
    data: {
      user_id: anonymousUserId,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      credits: appConfig.credits.anonymous_user,
      total_credits_used: 0,
      is_anonymous: true,
      expires_at: expiresAt,
      last_used_at: new Date(),
    },
  });

  console.log(`✅ 新匿名用户创建: ${anonymousUserId}, 初始积分: ${appConfig.credits.anonymous_user}`);
  return { user_id: anonUser.user_id, credits: anonUser.credits };
}

/**
 * 获取统一用户（支持 Firebase 用户和匿名用户）
 *
 * 优先使用 Firebase Token，其次使用设备指纹
 *
 * @throws Error 如果既没有 token 也没有设备指纹
 */
export async function getUserOrAnonymous(): Promise<UnifiedUser> {
  // IMPORTANT: 在 Next.js 15 中，headers() 必须在函数顶层调用
  // 这样确保在 Vercel 生产环境中正确工作
  const headersList = await headers();

  // 调试: 检查 headers 中是否有 authorization
  const authHeader = headersList.get('authorization');
  console.log('🔍 [getUserOrAnonymous] Authorization header exists:', !!authHeader);
  console.log('🔍 [getUserOrAnonymous] Authorization header preview:', authHeader?.substring(0, 20) + '...');

  // 1. 尝试 Firebase Token 验证
  const firebaseUser = await verifyFirebaseToken(headersList);

  if (firebaseUser) {
    console.log('🔍 [getUserOrAnonymous] Firebase User:', firebaseUser.uid);
    return {
      user_id: firebaseUser.uid,
      is_anonymous: false,
    };
  }

  // 2. 降级到匿名用户
  const fingerprint = headersList.get('x-device-fingerprint');

  console.log('🔍 [getUserOrAnonymous] Firebase 验证失败,检查设备指纹');
  console.log('🔍 [getUserOrAnonymous] Fingerprint:', fingerprint);

  if (fingerprint) {
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || undefined;
    const userAgent = headersList.get('user-agent') || undefined;

    const anonUser = await createOrGetAnonymousUser(fingerprint, ipAddress, userAgent);

    console.log('⚠️ [getUserOrAnonymous] 已降级到匿名用户:', anonUser.user_id);

    return {
      user_id: anonUser.user_id,
      is_anonymous: true,
    };
  }

  console.error('❌ [getUserOrAnonymous] 既没有 Firebase token 也没有设备指纹');
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