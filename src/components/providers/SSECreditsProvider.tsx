'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { createCreditsSSE, closeCreditsSSE, type CreditsSSEData, type SSEController } from '@/lib/api/sse';
import { auth } from '@/lib/firebase';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';

/**
 * SSE Credits Provider
 *
 * 为特定页面启用 SSE 实时积分更新
 * 使用方式：在需要实时积分更新的页面中包裹此组件
 *
 * @example
 * ```tsx
 * export default function TTSPage() {
 *   return (
 *     <SSECreditsProvider>
 *       <YourPageContent />
 *     </SSECreditsProvider>
 *   );
 * }
 * ```
 */
export default function SSECreditsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { updateCredits } = useCredits();
  const controllerRef = useRef<SSEController | null>(null);

  // 处理 SSE 消息（带用户验证）
  const handleCreditsUpdate = useCallback((data: CreditsSSEData) => {
    if (data.error) {
      console.error('[SSECreditsProvider] 服务器错误:', data.error);
      return;
    }

    // 验证返回的用户ID是否匹配
    const currentUser = auth.currentUser;
    const expectedUserId = currentUser ? currentUser.uid : null;

    if (currentUser && data.user_id !== expectedUserId) {
      console.warn('[SSECreditsProvider] ⚠️ 用户ID不匹配:', {
        expected: expectedUserId,
        received: data.user_id,
        is_anonymous: data.is_anonymous,
      });
      return;
    }

    if (typeof data.credits === 'number') {
      console.log('💰 [SSE] 积分实时更新:', {
        credits: data.credits,
        user_id: data.user_id,
        is_anonymous: data.is_anonymous,
      });
      // 直接更新积分，不发起 API 请求
      updateCredits(data.credits);
    }
  }, [updateCredits]);

  useEffect(() => {
    // 等待认证完成后再建立 SSE 连接
    if (authLoading) {
      console.log('[SSECreditsProvider] 等待认证完成...');
      return;
    }

    console.log('[SSECreditsProvider] 认证完成，准备建立 SSE 连接', {
      isLoggedIn: !!user,
    });

    // 建立 SSE 连接
    const connectSSE = async () => {
      try {
        const currentUser = auth.currentUser;

        let token: string | null = null;
        let deviceFingerprint: string | null = null;

        if (currentUser) {
          token = await currentUser.getIdToken();
          console.log('[SSECreditsProvider] 使用 Token 认证 (已登录用户)');
        } else {
          deviceFingerprint = await getDeviceFingerprint();
          console.log('[SSECreditsProvider] 使用设备指纹认证 (匿名用户)');
        }

        const controller = createCreditsSSE({
          token: token || undefined,
          deviceFingerprint: deviceFingerprint || undefined,
          onMessage: handleCreditsUpdate,
          onError: (error) => {
            console.error('[SSECreditsProvider] 连接错误:', error);
          },
          onOpen: () => {
            console.log('[SSECreditsProvider] SSE 连接已建立');
          },
        });

        controllerRef.current = controller;
      } catch (error) {
        console.error('[SSECreditsProvider] 创建 SSE 连接失败:', error);
      }
    };

    void connectSSE();

    // 清理函数：关闭 SSE 连接
    return () => {
      if (controllerRef.current) {
        closeCreditsSSE(controllerRef.current);
        controllerRef.current = null;
        console.log('[SSECreditsProvider] SSE 连接已关闭');
      }
    };
  }, [authLoading, user, handleCreditsUpdate]);

  return <>{children}</>;
}