import { useEffect, useRef, useCallback } from 'react';
import { createCreditsSSE, closeCreditsSSE, type CreditsSSEData, type SSEController } from '@/lib/api/sse';
import { auth } from '@/lib/firebase';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';

interface UseCreditsSSEOptions {
  onCreditsUpdate?: (credits: number) => void;
  enabled?: boolean;
}

/**
 * SSE Hook for real-time credits updates
 *
 * 使用 Server-Sent Events 实时推送用户积分更新
 *
 * @param options.onCreditsUpdate - 积分更新回调
 * @param options.enabled - 是否启用SSE连接
 */
export function useCreditsSSE({ onCreditsUpdate, enabled = true }: UseCreditsSSEOptions = {}) {
  const controllerRef = useRef<SSEController | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  // 处理SSE消息
  const handleMessage = useCallback((data: CreditsSSEData) => {
    if (data.error) {
      console.error('[useCreditsSSE] 服务器错误:', data.error);
      return;
    }

    if (onCreditsUpdate && typeof data.credits === 'number') {
      onCreditsUpdate(data.credits);
    }
  }, [onCreditsUpdate]);

  useEffect(() => {
    // 如果未启用,不建立连接
    if (!enabled) {
      return;
    }

    // 建立 SSE 连接
    const connectSSE = async () => {
      try {
        // 使用与 API Client 相同的认证方式
        const currentUser = auth.currentUser;

        let token: string | null = null;
        let deviceFingerprint: string | null = null;

        if (currentUser) {
          // 已登录用户：获取 ID Token
          token = await currentUser.getIdToken();
          console.log('[useCreditsSSE] 使用 Token 认证');
        } else {
          // 匿名用户：获取设备指纹
          deviceFingerprint = await getDeviceFingerprint();
          console.log('[useCreditsSSE] 使用设备指纹认证');
        }

        // 使用 API 创建 SSE 连接
        const controller = createCreditsSSE({
          token: token || undefined,
          deviceFingerprint: deviceFingerprint || undefined,
          onMessage: handleMessage,
          onError: (error) => {
            console.error('[useCreditsSSE] 连接错误:', error);
            isConnectedRef.current = false;
          },
          onOpen: () => {
            console.log('[useCreditsSSE] 连接已建立');
            isConnectedRef.current = true;
          },
        });

        controllerRef.current = controller;
      } catch (error) {
        console.error('[useCreditsSSE] 创建SSE连接失败:', error);
      }
    };

    void connectSSE();

    // 清理函数: 关闭 SSE 连接
    return () => {
      closeCreditsSSE(controllerRef.current);
      controllerRef.current = null;
      isConnectedRef.current = false;
    };
  }, [enabled, handleMessage]);

  return {
    isConnected: isConnectedRef.current,
  };
}