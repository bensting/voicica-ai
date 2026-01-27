'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAdsterraSmartLinkUrl, getAdsterraMinWaitSeconds, isAdsterraEnabled } from '@/config/ads/adsterra';

export interface AdsterraResult {
  success: boolean;
  message?: string;
  reason?: 'completed' | 'cancelled' | 'timeout' | 'disabled' | 'error' | 'window_closed';
}

interface UseAdsterraSmartLinkReturn {
  /** 是否正在显示广告（倒计时中） */
  isShowing: boolean;
  /** 剩余秒数 */
  remainingSeconds: number;
  /** 是否已完成等待 */
  isCompleted: boolean;
  /** 弹出窗口是否已关闭 */
  isWindowClosed: boolean;
  /** 显示广告并开始计时 */
  showAd: () => Promise<AdsterraResult>;
  /** 取消广告 */
  cancel: () => void;
  /** 确认完成（用户点击确认后调用） */
  confirmComplete: () => void;
  /** 是否启用 */
  isEnabled: boolean;
  /** 总等待时间 */
  totalSeconds: number;
}

/**
 * Adsterra Smart Link Hook
 *
 * 使用弹出窗口打开广告，用户等待指定时间后才能获得奖励
 * 会监控弹出窗口状态，如果用户关闭窗口会提示
 */
export function useAdsterraSmartLink(): UseAdsterraSmartLinkReturn {
  const [isShowing, setIsShowing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWindowClosed, setIsWindowClosed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const windowCheckRef = useRef<NodeJS.Timeout | null>(null);
  const adWindowRef = useRef<Window | null>(null);
  const resolveRef = useRef<((result: AdsterraResult) => void) | null>(null);

  const isEnabled = isAdsterraEnabled();
  const totalSeconds = getAdsterraMinWaitSeconds();

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (windowCheckRef.current) {
      clearInterval(windowCheckRef.current);
      windowCheckRef.current = null;
    }
  }, []);

  // 关闭弹出窗口
  const closeAdWindow = useCallback(() => {
    if (adWindowRef.current && !adWindowRef.current.closed) {
      adWindowRef.current.close();
    }
    adWindowRef.current = null;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimers();
      closeAdWindow();
    };
  }, [clearTimers, closeAdWindow]);

  // 取消广告
  const cancel = useCallback(() => {
    clearTimers();
    closeAdWindow();
    setIsShowing(false);
    setRemainingSeconds(0);
    setIsCompleted(false);
    setIsWindowClosed(false);

    if (resolveRef.current) {
      resolveRef.current({
        success: false,
        message: '已取消',
        reason: 'cancelled',
      });
      resolveRef.current = null;
    }
  }, [clearTimers, closeAdWindow]);

  // 确认完成
  const confirmComplete = useCallback(() => {
    if (!isCompleted) return;

    clearTimers();
    closeAdWindow();
    setIsShowing(false);
    setRemainingSeconds(0);
    setIsCompleted(false);
    setIsWindowClosed(false);

    if (resolveRef.current) {
      // 只要倒计时完成，就给奖励（不管窗口是否关闭）
      resolveRef.current({
        success: true,
        reason: 'completed',
      });
      resolveRef.current = null;
    }
  }, [isCompleted, clearTimers, closeAdWindow]);

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

      const adUrl = getAdsterraSmartLinkUrl();
      const waitSeconds = totalSeconds;

      // 打开弹出窗口
      const width = 400;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      adWindowRef.current = window.open(
        adUrl,
        'adsterra_ad',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!adWindowRef.current) {
        resolve({
          success: false,
          message: '弹出窗口被阻止，请允许弹出窗口',
          reason: 'error',
        });
        return;
      }

      // 开始计时
      setIsShowing(true);
      setRemainingSeconds(waitSeconds);
      setIsCompleted(false);
      setIsWindowClosed(false);

      // 倒计时
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // 倒计时完成
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 监控弹出窗口状态
      windowCheckRef.current = setInterval(() => {
        if (adWindowRef.current?.closed) {
          setIsWindowClosed(true);
          // 不自动取消，让用户看到提示
        }
      }, 500);
    });
  }, [isEnabled, totalSeconds]);

  return {
    isShowing,
    remainingSeconds,
    isCompleted,
    isWindowClosed,
    showAd,
    cancel,
    confirmComplete,
    isEnabled,
    totalSeconds,
  };
}
