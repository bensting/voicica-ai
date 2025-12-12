'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import {
  getMonthlyCreditsStatus,
  claimAnonymousReward,
  claimLoginReward,
  claimAppDownloadReward,
  getMonthlyRewardsConfigAction,
  type MonthlyCreditsStatus,
  type ClaimResult,
} from '@/actions/monthly-credits';

// 弹窗显示次数存储 key
const POPUP_COUNT_KEY_PREFIX = 'monthly_reward_popup_';

interface UseMonthlyCreditsReturn {
  /** 月度积分状态 */
  status: MonthlyCreditsStatus | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在领取 */
  claiming: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否应该显示弹窗 */
  shouldShowPopup: boolean;
  /** 应该显示的弹窗类型 */
  popupType: 'anonymous' | 'login' | 'app_download' | null;
  /** 刷新状态 */
  refresh: () => Promise<void>;
  /** 领取匿名福利 */
  claimAnonymous: (deviceId: string) => Promise<ClaimResult>;
  /** 领取登录福利 */
  claimLogin: () => Promise<ClaimResult>;
  /** 领取APP福利 */
  claimAppDownload: () => Promise<ClaimResult>;
  /** 标记弹窗已显示 */
  markPopupShown: () => void;
  /** 关闭弹窗（不再显示今天） */
  dismissPopup: () => void;
  /** 配置信息 */
  config: {
    anonymous_credits: number;
    login_credits: number;
    app_download_credits: number;
    popup_max_per_day: number;
    enabled: boolean;
  } | null;
}

/**
 * 检测是否为移动设备（Android/iOS）
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod/.test(userAgent);
}

/**
 * 检测是否为 Android 设备
 */
function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * 获取今天的日期字符串
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取今天的弹窗显示次数
 */
function getPopupCountToday(type: string): number {
  if (typeof window === 'undefined') return 0;
  const key = `${POPUP_COUNT_KEY_PREFIX}${type}_${getTodayKey()}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

/**
 * 增加今天的弹窗显示次数
 */
function incrementPopupCount(type: string): void {
  if (typeof window === 'undefined') return;
  const key = `${POPUP_COUNT_KEY_PREFIX}${type}_${getTodayKey()}`;
  const count = getPopupCountToday(type);
  localStorage.setItem(key, String(count + 1));
}

/**
 * 月度积分 Hook
 *
 * 职责：
 * - 管理月度积分状态
 * - 处理福利领取逻辑
 * - 控制弹窗显示逻辑
 */
export function useMonthlyCredits(): UseMonthlyCreditsReturn {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [status, setStatus] = useState<MonthlyCreditsStatus | null>(null);
  const [config, setConfig] = useState<UseMonthlyCreditsReturn['config']>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'anonymous' | 'login' | 'app_download' | null>(null);
  const [popupDismissed, setPopupDismissed] = useState(false);

  // 加载配置
  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await getMonthlyRewardsConfigAction();
        setConfig(cfg);
      } catch (err) {
        console.error('❌ [useMonthlyCredits] 加载配置失败:', err);
      }
    }
    loadConfig();
  }, []);

  // 加载状态
  const refresh = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getMonthlyCreditsStatus();
      setStatus(data);
    } catch (err) {
      console.error('❌ [useMonthlyCredits] 加载状态失败:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  // 初始化加载
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 计算弹窗显示逻辑
  useEffect(() => {
    if (loading || !status || !config || popupDismissed || !config.enabled) {
      setShouldShowPopup(false);
      setPopupType(null);
      return;
    }

    const maxPerDay = config.popup_max_per_day;

    // 判断应该显示哪种弹窗
    if (!user) {
      // 匿名用户：显示登录引导弹窗（包含游客领取选项）
      if (!status.rewards.anonymous.claimed) {
        const count = getPopupCountToday('anonymous');
        if (count < maxPerDay) {
          setShouldShowPopup(true);
          setPopupType('anonymous');
          return;
        }
      }
    } else {
      // 已登录用户
      if (!status.rewards.login.claimed) {
        // 未领取登录福利
        const count = getPopupCountToday('login');
        if (count < maxPerDay) {
          setShouldShowPopup(true);
          setPopupType('login');
          return;
        }
      } else if (!status.rewards.app_download.claimed && isMobileDevice()) {
        // 已领登录福利，未领APP福利，且在移动端
        const count = getPopupCountToday('app_download');
        if (count < maxPerDay) {
          setShouldShowPopup(true);
          setPopupType('app_download');
          return;
        }
      }
    }

    setShouldShowPopup(false);
    setPopupType(null);
  }, [loading, status, config, user, popupDismissed]);

  // 标记弹窗已显示
  const markPopupShown = useCallback(() => {
    if (popupType) {
      incrementPopupCount(popupType);
    }
  }, [popupType]);

  // 关闭弹窗
  const dismissPopup = useCallback(() => {
    setPopupDismissed(true);
    setShouldShowPopup(false);
  }, []);

  // 领取匿名福利
  const claimAnonymous = useCallback(async (deviceId: string): Promise<ClaimResult> => {
    try {
      setClaiming(true);
      setError(null);
      const result = await claimAnonymousReward(deviceId);
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '领取失败';
      setError(message);
      return { success: false, message };
    } finally {
      setClaiming(false);
    }
  }, [refresh]);

  // 领取登录福利
  const claimLogin = useCallback(async (): Promise<ClaimResult> => {
    try {
      setClaiming(true);
      setError(null);
      const result = await claimLoginReward();
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '领取失败';
      setError(message);
      return { success: false, message };
    } finally {
      setClaiming(false);
    }
  }, [refresh]);

  // 领取APP福利
  const claimAppDownload = useCallback(async (): Promise<ClaimResult> => {
    try {
      setClaiming(true);
      setError(null);
      const result = await claimAppDownloadReward();
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '领取失败';
      setError(message);
      return { success: false, message };
    } finally {
      setClaiming(false);
    }
  }, [refresh]);

  return {
    status,
    loading,
    claiming,
    error,
    shouldShowPopup,
    popupType,
    refresh,
    claimAnonymous,
    claimLogin,
    claimAppDownload,
    markPopupShown,
    dismissPopup,
    config,
  };
}

// 导出工具函数
export { isMobileDevice, isAndroidDevice };