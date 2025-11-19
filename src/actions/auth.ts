'use server';

/**
 * 认证相关 Server Actions
 */
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

/**
 * 设置认证 Cookie
 *
 * 前端登录后调用此方法设置 httpOnly cookie
 */
export async function setAuthCookie(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 验证 token 有效性
    const decodedToken = await auth.verifyIdToken(token);

    // 获取 token 过期时间
    const expiresIn = 60 * 60 * 24 * 5; // 5 天

    const cookieStore = await cookies();
    cookieStore.set('firebase-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    console.log(`认证 Cookie 设置成功: ${decodedToken.uid}`);

    return { success: true };
  } catch (error) {
    console.error('设置认证 Cookie 失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 清除认证 Cookie
 *
 * 前端登出时调用
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('firebase-token');
  console.log('认证 Cookie 已清除');
}

/**
 * 检查认证状态
 */
export async function checkAuthStatus(): Promise<{
  authenticated: boolean;
  uid?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-token')?.value;

    if (!token) {
      return { authenticated: false };
    }

    const decodedToken = await auth.verifyIdToken(token);
    return {
      authenticated: true,
      uid: decodedToken.uid,
    };
  } catch {
    return { authenticated: false };
  }
}
