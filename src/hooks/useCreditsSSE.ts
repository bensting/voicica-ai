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
 * 特性：
 * - 自动刷新 Token（每 50 分钟重连一次，避免 token 过期）
 * - 监听用户登录状态变化，自动重连
 *
 * @param options.onCreditsUpdate - 积分更新回调
 * @param options.enabled - 是否启用SSE连接
 */
export function useCreditsSSE({ onCreditsUpdate, enabled = true }: UseCreditsSSEOptions = {}) {
  const controllerRef = useRef<SSEController | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 建立 SSE 连接
  const connectSSE = useCallback(async () => {
    try {
      // 关闭旧连接
      if (controllerRef.current) {
        console.log('[useCreditsSSE] 关闭旧连接');
        closeCreditsSSE(controllerRef.current);
        controllerRef.current = null;
      }

      // 使用与 API Client 相同的认证方式
      const currentUser = auth.currentUser;

      let token: string | null = null;
      let deviceFingerprint: string | null = null;

      if (currentUser) {
        // 已登录用户：获取 ID Token（强制刷新以获取最新 token）
        token = await currentUser.getIdToken(true);
        console.log('[useCreditsSSE] 使用 Token 认证（已刷新）');
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

      // 清除旧的定时器
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // 设置 50 分钟后自动重连（Firebase token 有效期 1 小时）
      refreshTimerRef.current = setTimeout(() => {
        console.log('[useCreditsSSE] Token 即将过期，重新建立连接');
        void connectSSE();
      }, 50 * 60 * 1000); // 50 分钟
    } catch (error) {
      console.error('[useCreditsSSE] 创建SSE连接失败:', error);
    }
  }, [handleMessage]);

  useEffect(() => {
    // 如果未启用,不建立连接
    if (!enabled) {
      return;
    }

    // 建立初始连接
    void connectSSE();

    // 监听 Firebase 认证状态变化（用户登录/登出时重连）
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('[useCreditsSSE] 认证状态变化:', user ? '已登录' : '未登录');
      // 用户状态变化时重新连接
      void connectSSE();
    });

    // 清理函数: 关闭 SSE 连接和定时器
    return () => {
      console.log('[useCreditsSSE] 清理连接和定时器');
      closeCreditsSSE(controllerRef.current);
      controllerRef.current = null;
      isConnectedRef.current = false;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      unsubscribe();
    };
  }, [enabled, connectSSE]);

  return {
    isConnected: isConnectedRef.current,
  };
}