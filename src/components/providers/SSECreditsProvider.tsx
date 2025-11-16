'use client';

import { useEffect, useCallback } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { createCreditsSSE, closeCreditsSSE, type CreditsSSEData, type SSEController } from '@/lib/api/sse';
import { auth } from '@/lib/firebase';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';
import { useRef } from 'react';

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
  const { refreshCredits } = useCredits();
  const controllerRef = useRef<SSEController | null>(null);

  // 处理 SSE 消息
  const handleCreditsUpdate = useCallback((data: CreditsSSEData) => {
    if (data.error) {
      console.error('[SSECreditsProvider] 服务器错误:', data.error);
      return;
    }

    if (typeof data.credits === 'number') {
      console.log('💰 [SSE] 积分实时更新:', data.credits);
      // 触发 CreditsContext 的刷新
      void refreshCredits();
    }
  }, [refreshCredits]);

  useEffect(() => {
    // 建立 SSE 连接
    const connectSSE = async () => {
      try {
        const currentUser = auth.currentUser;

        let token: string | null = null;
        let deviceFingerprint: string | null = null;

        if (currentUser) {
          token = await currentUser.getIdToken();
          console.log('[SSECreditsProvider] 使用 Token 认证');
        } else {
          deviceFingerprint = await getDeviceFingerprint();
          console.log('[SSECreditsProvider] 使用设备指纹认证');
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
  }, [handleCreditsUpdate]);

  return <>{children}</>;
}