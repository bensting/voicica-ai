'use server';

/**
 * 认证相关 Server Actions
 *
 * Auth.js 自动管理 session,这些函数主要用于兼容旧代码
 */
import { auth } from '@/lib/auth-next';

/**
 * 检查认证状态
 */
export async function checkAuthStatus(): Promise<{
  authenticated: boolean;
  userId?: string;
}> {
  const session = await auth();

  if (!session?.user) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    userId: session.user.id,
  };
}

/**
 * @deprecated Auth.js 自动管理 cookie,无需手动设置
 */
export async function setAuthCookie(_token: string): Promise<{ success: boolean; error?: string }> {
  console.warn('setAuthCookie is deprecated - Auth.js manages sessions automatically');
  return { success: true };
}

/**
 * @deprecated Auth.js 自动管理 cookie,无需手动清除
 */
export async function clearAuthCookie(): Promise<void> {
  console.warn('clearAuthCookie is deprecated - Auth.js manages sessions automatically');
}
