'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import {
  getDailyTasksStatus,
  checkin,
  claimAdReward,
  type DailyTasksStatus,
  type TaskResult,
} from '@/actions/daily-tasks';
import { getDailyTasksConfig, type DailyTasksConfig } from '@/config/appConfig';
import { useRewardedAd } from './useRewardedAd';
import { useInterstitialRewardedAd } from './useInterstitialRewardedAd';
import { Capacitor } from '@capacitor/core';

// 弹窗上次显示时间存储 key
const POPUP_LAST_SHOWN_KEY = 'daily_tasks_popup_last_shown';

interface UseDailyTasksReturn {
  /** 每日任务状态 */
  status: DailyTasksStatus | null;
  /** 配置 */
  config: DailyTasksConfig | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在执行操作 */
  claiming: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否应该显示弹窗 */
  shouldShowPopup: boolean;
  /** 是否在原生应用中 */
  isNativeApp: boolean;
  /** 广告是否准备好 */
  isAdReady: boolean;
  /** 刷新状态 */
  refresh: () => Promise<void>;
  /** 签到 */
  doCheckin: () => Promise<TaskResult>;
  /** 领取广告奖励 */
  doClaimAdReward: () => Promise<TaskResult>;
  /** 标记弹窗已显示 */
  markPopupShown: () => void;
  /** 关闭弹窗（不再显示今天） */
  dismissPopup: () => void;
  /** 取消正在进行的操作 */
  cancelClaiming: () => void;
}

/**
 * 获取上次弹窗显示时间
 */
function getLastPopupTime(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(POPUP_LAST_SHOWN_KEY) || '0', 10);
}

/**
 * 记录弹窗显示时间
 */
function setLastPopupTime(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(POPUP_LAST_SHOWN_KEY, String(Date.now()));
}

/**
 * 检查是否已过间隔时间
 */
function hasIntervalPassed(intervalMinutes: number): boolean {
  const lastTime = getLastPopupTime();
  if (lastTime === 0) return true; // 从未显示过
  const intervalMs = intervalMinutes * 60 * 1000;
  return Date.now() - lastTime >= intervalMs;
}

/**
 * 每日任务 Hook
 */
export function useDailyTasks(): UseDailyTasksReturn {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { showRewardedAd, isReady: isAdReady } = useRewardedAd();
  const { showInterstitialRewardedAd } = useInterstitialRewardedAd();
  const isNative = Capacitor.isNativePlatform();
  const [status, setStatus] = useState<DailyTasksStatus | null>(null);
  // 直接从客户端同步获取配置，无需 Server Action 网络请求
  const [config] = useState<DailyTasksConfig | null>(() => getDailyTasksConfig());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  // 加载状态
  const refresh = useCallback(async () => {
    if (authLoading) return;

    // 未登录用户不加载状态
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDailyTasksStatus();
      setStatus(data);
    } catch (err) {
      console.error('❌ [useDailyTasks] 加载状态失败:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  // 初始化加载
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 计算弹窗显示逻辑
  useEffect(() => {
    if (loading || !config || popupDismissed || !config.enabled) {
      setShouldShowPopup(false);
      return;
    }

    // 检查是否已过间隔时间
    if (!hasIntervalPassed(config.popup_interval_minutes)) {
      setShouldShowPopup(false);
      return;
    }

    // 未登录用户：显示弹窗引导登录
    if (!user) {
      setShouldShowPopup(true);
      return;
    }

    // 已登录用户：如果还有任务未完成，显示弹窗
    if (user && status) {
      const hasUnclaimedTasks =
        !status.checkinDone ||
        status.adRewardsClaimed < (config.ad_reward_tiers?.length || 0);

      if (hasUnclaimedTasks) {
        setShouldShowPopup(true);
        return;
      }
    }

    setShouldShowPopup(false);
  }, [loading, status, config, user, popupDismissed]);

  // 标记弹窗已显示
  const markPopupShown = useCallback(() => {
    setLastPopupTime();
  }, []);

  // 关闭弹窗
  const dismissPopup = useCallback(() => {
    setPopupDismissed(true);
    setShouldShowPopup(false);
  }, []);

  // 用于防止签到重复调用
  const checkinInProgressRef = useRef(false);
  // 用于标记是否已取消
  const cancelledRef = useRef(false);

  // 取消正在进行的操作
  const cancelClaiming = useCallback(() => {
    console.log('[useDailyTasks] cancelClaiming called');
    cancelledRef.current = true;
    setClaiming(false);
    checkinInProgressRef.current = false;
  }, []);

  // 签到（需要先观看插页式激励广告）
  const doCheckin = useCallback(async (): Promise<TaskResult> => {
    // 防止重复调用
    if (checkinInProgressRef.current) {
      console.log('[useDailyTasks] doCheckin already in progress, skipping');
      return { success: false, message: 'Already processing' };
    }

    try {
      checkinInProgressRef.current = true;
      cancelledRef.current = false;
      setClaiming(true);
      setError(null);

      // 原生平台需要先观看插页式激励广告
      if (isNative) {
        console.log('[useDailyTasks] 开始显示签到插页式激励广告...');
        const adWatched = await showInterstitialRewardedAd();

        // 检查是否已取消
        if (cancelledRef.current) {
          console.log('[useDailyTasks] 签到已被用户取消');
          return { success: false, message: '已取消' };
        }

        if (!adWatched) {
          console.log('[useDailyTasks] 用户未完成广告观看，取消签到');
          return { success: false, message: '请观看完整广告以完成签到' };
        }
        console.log('[useDailyTasks] 广告观看成功，开始签到...');
      }

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[useDailyTasks] 签到已被用户取消');
        return { success: false, message: '已取消' };
      }

      // 调用签到接口
      const result = await checkin();
      if (result.success && !cancelledRef.current) {
        await refresh();
      }
      return result;
    } catch (err) {
      if (cancelledRef.current) {
        return { success: false, message: '已取消' };
      }
      const message = err instanceof Error ? err.message : '签到失败';
      setError(message);
      return { success: false, message };
    } finally {
      if (!cancelledRef.current) {
        setClaiming(false);
      }
      checkinInProgressRef.current = false;
    }
  }, [refresh, isNative, showInterstitialRewardedAd]);

  // 用于跟踪奖励是否已领取
  const rewardClaimedRef = useRef(false);
  const claimResultRef = useRef<TaskResult | null>(null);

  // 领取广告奖励
  const doClaimAdReward = useCallback(async (): Promise<TaskResult> => {
    try {
      cancelledRef.current = false;
      setClaiming(true);
      setError(null);
      rewardClaimedRef.current = false;
      claimResultRef.current = null;

      // 如果是原生平台且使用 Appodeal，监听 claimRewardNow 事件
      const isNative = Capacitor.isNativePlatform();
      let listenerRemove: (() => void) | null = null;

      if (isNative) {
        try {
          const { Appodeal } = await import('@/plugins/appodeal');
          const listener = await Appodeal.addListener('claimRewardNow', async (data) => {
            console.log('[DailyTasks] 收到 claimRewardNow 事件, adIndex:', data.adIndex);

            // 如果已取消，不领取奖励
            if (cancelledRef.current) {
              console.log('[DailyTasks] 已取消，跳过奖励领取');
              return;
            }

            // 只在第一次收到事件时领取奖励
            if (!rewardClaimedRef.current) {
              rewardClaimedRef.current = true;
              console.log('[DailyTasks] 第1个广告完成，立即领取奖励...');
              const result = await claimAdReward(true);
              claimResultRef.current = result;
              console.log('[DailyTasks] 奖励领取结果:', result);
              if (result.success) {
                refresh(); // 刷新状态（不等待）
              }
            }
          });
          listenerRemove = () => listener.remove();
        } catch (err) {
          console.warn('[DailyTasks] 无法监听 Appodeal 事件:', err);
        }
      }

      // 显示激励广告
      console.log('[DailyTasks] 开始显示激励广告...');
      const adWatched = await showRewardedAd();

      // 移除监听器
      if (listenerRemove) {
        listenerRemove();
      }

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[DailyTasks] 广告奖励已被用户取消');
        return { success: false, message: '已取消' };
      }

      if (!adWatched) {
        console.log('[DailyTasks] 用户未完成广告观看');
        return { success: false, message: '请观看完整广告以获得奖励' };
      }

      // 如果奖励已经在广告播放过程中领取了，返回那个结果
      if (rewardClaimedRef.current && claimResultRef.current) {
        console.log('[DailyTasks] 奖励已在广告过程中领取');
        return claimResultRef.current;
      }

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[DailyTasks] 广告奖励已被用户取消');
        return { success: false, message: '已取消' };
      }

      // 兜底：如果事件没有触发，在广告结束后领取
      console.log('[DailyTasks] 广告观看成功，领取奖励（兜底）...');
      const result = await claimAdReward(true);
      if (result.success && !cancelledRef.current) {
        await refresh();
      }
      return result;
    } catch (err) {
      if (cancelledRef.current) {
        return { success: false, message: '已取消' };
      }
      const message = err instanceof Error ? err.message : '领取失败';
      setError(message);
      return { success: false, message };
    } finally {
      if (!cancelledRef.current) {
        setClaiming(false);
      }
    }
  }, [refresh, showRewardedAd]);

  return {
    status,
    config,
    loading,
    claiming,
    error,
    shouldShowPopup,
    isNativeApp: isNative,
    isAdReady,
    refresh,
    doCheckin,
    doClaimAdReward,
    markPopupShown,
    dismissPopup,
    cancelClaiming,
  };
}