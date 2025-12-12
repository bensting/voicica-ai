'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import {
  getDailyTasksStatus,
  getDailyTasksConfigAction,
  checkin,
  claimAdReward,
  type DailyTasksStatus,
  type TaskResult,
} from '@/actions/daily-tasks';
import type { DailyTasksConfig } from '@/config/appConfig';

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
  const [status, setStatus] = useState<DailyTasksStatus | null>(null);
  const [config, setConfig] = useState<DailyTasksConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  // 加载配置
  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await getDailyTasksConfigAction();
        setConfig(cfg);
      } catch (err) {
        console.error('❌ [useDailyTasks] 加载配置失败:', err);
      }
    }
    loadConfig();
  }, []);

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

  // 签到
  const doCheckin = useCallback(async (): Promise<TaskResult> => {
    try {
      setClaiming(true);
      setError(null);
      const result = await checkin();
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '签到失败';
      setError(message);
      return { success: false, message };
    } finally {
      setClaiming(false);
    }
  }, [refresh]);

  // 领取广告奖励
  const doClaimAdReward = useCallback(async (): Promise<TaskResult> => {
    try {
      setClaiming(true);
      setError(null);
      const result = await claimAdReward(true); // 第一阶段模拟广告已观看
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
    config,
    loading,
    claiming,
    error,
    shouldShowPopup,
    refresh,
    doCheckin,
    doClaimAdReward,
    markPopupShown,
    dismissPopup,
  };
}