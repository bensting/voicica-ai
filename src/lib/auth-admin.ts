/**
 * 管理员权限验证工具
 */
import { headers } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth-firebase';
import { ADMIN_EMAILS } from '@/config/admin';

/**
 * 验证管理员权限（不查询数据库，仅验证 Firebase token）
 * 用于数据库迁移等操作，此时数据库表可能还不存在
 */
export async function verifyAdminWithoutDb(): Promise<void> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未登录');
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
      throw new Error('无权限访问');
    }
  } catch (error) {
    console.error('❌ [Admin] 验证失败:', error);
    throw new Error('验证失败');
  }
}

/**
 * 验证管理员权限（需要数据库）
 */
export async function verifyAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('无权限访问');
  }
}