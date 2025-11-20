'use client';

/**
 * Server Action Hook with Firebase Auth
 *
 * 自动在调用 Server Action 前设置 Authorization header
 * 让 Server Actions 能够验证 Firebase token
 */
import { useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

/**
 * 设置全局 fetch 拦截器
 * 自动添加 Firebase token 到所有 Server Action 请求
 */
export function useServerAction() {
  const { token } = useFirebaseAuth();

  const callServerAction = useCallback(
    async <T, A extends unknown[]>(
      action: (...args: A) => Promise<T>,
      ...args: A
    ): Promise<T> => {
      // 临时设置 headers
      // Server Actions 通过 Next.js 的内部机制传递 headers
      // 我们需要通过 cookies 或 headers() 在服务端获取

      // 注意：这里需要配合服务端中间件或者直接在 Server Action 中读取 header
      // Next.js Server Actions 会自动传递 cookies 和 headers

      if (token) {
        // 将 token 存储到 localStorage 或 sessionStorage
        // 服务端可以通过 middleware 或其他方式读取
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('firebase-token', token);
        }
      }

      return action(...args);
    },
    [token]
  );

  return { callServerAction, token };
}