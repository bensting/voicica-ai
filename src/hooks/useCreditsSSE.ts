import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createCreditsSSE, closeCreditsSSE, type CreditsSSEData } from '@/lib/api/sse';

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
  const { user, loading } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

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
    // 如果未启用或正在加载认证状态,不建立连接
    if (!enabled || loading) {
      return;
    }

    // 建立 SSE 连接
    const connectSSE = async () => {
      try {
        // 获取 Token 或设备指纹
        const token = user ? await user.getIdToken() : null;
        const deviceFingerprint = !user ? localStorage.getItem('deviceFingerprint') : null;

        // 如果既没有 token 也没有设备指纹,不建立连接
        if (!token && !deviceFingerprint) {
          console.warn('[useCreditsSSE] 无法建立SSE连接: 缺少认证信息');
          return;
        }

        // 使用 API 创建 SSE 连接
        const eventSource = createCreditsSSE({
          token: token || undefined,
          deviceFingerprint: deviceFingerprint || undefined,
          onMessage: handleMessage,
          onError: (error) => {
            console.error('[useCreditsSSE] 连接错误:', error);
          },
          onOpen: () => {
            console.log('[useCreditsSSE] 连接已建立');
          },
        });

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('[useCreditsSSE] 创建SSE连接失败:', error);
      }
    };

    void connectSSE();

    // 清理函数: 关闭 SSE 连接
    return () => {
      closeCreditsSSE(eventSourceRef.current);
      eventSourceRef.current = null;
    };
  }, [enabled, loading, user, handleMessage]);

  return {
    isConnected: eventSourceRef.current !== null && eventSourceRef.current.readyState === EventSource.OPEN,
  };
}