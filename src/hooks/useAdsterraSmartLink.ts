'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAdsterraSmartLinkUrl, getAdsterraMinWaitSeconds, isAdsterraEnabled } from '@/config/ads/adsterra';

export interface AdsterraResult {
  success: boolean;
  message?: string;
  reason?: 'completed' | 'cancelled' | 'timeout' | 'disabled' | 'error';
}

interface UseAdsterraSmartLinkReturn {
  /** 是否正在显示广告（计时中） */
  isShowing: boolean;
  /** 剩余秒数 */
  remainingSeconds: number;
  /** 是否已完成等待 */
  isCompleted: boolean;
  /** 显示广告并开始计时 */
  showAd: () => Promise<AdsterraResult>;
  /** 取消广告 */
  cancel: () => void;
  /** 确认完成（用户点击确认后调用） */
  confirmComplete: () => void;
  /** 是否启用 */
  isEnabled: boolean;
}

/**
 * Adsterra Smart Link Hook
 *
 * 打开广告链接并让用户等待指定时间后才能获得奖励
 */
export function useAdsterraSmartLink(): UseAdsterraSmartLinkReturn {
  const [isShowing, setIsShowing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((result: AdsterraResult) => void) | null>(null);
  const popupRef = useRef<Window | null>(null);

  const isEnabled = isAdsterraEnabled();

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // 取消广告
  const cancel = useCallback(() => {
    clearTimer();
    setIsShowing(false);
    setRemainingSeconds(0);
    setIsCompleted(false);

    // 关闭弹出窗口
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;

    if (resolveRef.current) {
      resolveRef.current({
        success: false,
        message: '已取消',
        reason: 'cancelled',
      });
      resolveRef.current = null;
    }
  }, [clearTimer]);

  // 确认完成
  const confirmComplete = useCallback(() => {
    if (!isCompleted) return;

    clearTimer();
    setIsShowing(false);
    setRemainingSeconds(0);
    setIsCompleted(false);

    if (resolveRef.current) {
      resolveRef.current({
        success: true,
        reason: 'completed',
      });
      resolveRef.current = null;
    }
  }, [isCompleted, clearTimer]);

  // 显示广告
  const showAd = useCallback((): Promise<AdsterraResult> => {
    return new Promise((resolve) => {
      if (!isEnabled) {
        resolve({
          success: false,
          message: 'Adsterra is not enabled',
          reason: 'disabled',
        });
        return;
      }

      // 保存 resolve 函数
      resolveRef.current = resolve;

      const url = getAdsterraSmartLinkUrl();
      const waitSeconds = getAdsterraMinWaitSeconds();

      // 打开新窗口
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      popupRef.current = popup;

      // 开始计时
      setIsShowing(true);
      setRemainingSeconds(waitSeconds);
      setIsCompleted(false);

      // 开始倒计时
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // 倒计时完成
            clearTimer();
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  }, [isEnabled, clearTimer]);

  return {
    isShowing,
    remainingSeconds,
    isCompleted,
    showAd,
    cancel,
    confirmComplete,
    isEnabled,
  };
}
