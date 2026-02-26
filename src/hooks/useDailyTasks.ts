'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import {
  getDailyTasksStatus,
  checkin,
  claimAdReward,
  type DailyTasksStatus,
  type TaskResult,
} from '@/actions/daily-tasks';
import { getDailyTasksConfig, type DailyTasksBaseConfig } from '@/config/appConfig';
import { useRewardedAd } from './useRewardedAd';
import { useAdMob } from '@/contexts/AdMobContext';
import { Capacitor } from '@capacitor/core';

/**
 * 检测是否为 Native 应用环境（用于 UI 配置）
 * 1. Capacitor 原生平台检测
 * 2. URL 路径是否以 /native 开头（用于浏览器中测试 native 路由）
 */
function useIsNativeApp(): boolean {
  const pathname = usePathname();
  const isCapacitorNative = Capacitor.isNativePlatform();
  const isNativeRoute = pathname?.startsWith('/native');
  return isCapacitorNative || isNativeRoute;
}

/**
 * 是否为真正的原生平台（Capacitor），用于积分计算
 * 手机浏览器访问 /native 路由时，广告走的是 ExoClick（Web 端），
 * 所以积分估算应该用 Web eCPM，而不是 AdMob eCPM
 */
const isRealNativePlatform = Capacitor.isNativePlatform();

interface UseDailyTasksReturn {
  /** 每日任务状态 */
  status: DailyTasksStatus | null;
  /** 配置 */
  config: DailyTasksBaseConfig | null;
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
 * 每日任务 Hook
 */
export function useDailyTasks(): UseDailyTasksReturn {
  const { user, loading: authLoading, ensureFreshToken } = useFirebaseAuth();
  // 签到和观看视频都使用同一个激励视频广告，共享缓存，加载更快
  const { showRewardedAd, isReady: isAdReady } = useRewardedAd();
  // 获取最近一次广告收益数据（来自 AdMob OnPaidEvent）
  const { lastAdRevenue, clearLastAdRevenue } = useAdMob();
  // 用 ref 跟踪最新值，避免 useCallback 闭包捕获旧值
  const lastAdRevenueRef = useRef(lastAdRevenue);
  lastAdRevenueRef.current = lastAdRevenue;
  // 使用增强的 Native 检测（包括 Capacitor 和 /native 路由）
  const isNative = useIsNativeApp();
  const [status, setStatus] = useState<DailyTasksStatus | null>(null);
  // 直接从客户端同步获取配置，无需 Server Action 网络请求
  // Native App 和 Studio Web 使用各自独立的配置
  const [config, setConfig] = useState<DailyTasksBaseConfig | null>(null);

  // 根据 isNative 更新配置
  useEffect(() => {
    setConfig(getDailyTasksConfig(isNative));
  }, [isNative]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowPopup] = useState(false);

  // 加载状态
  const refresh = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getDailyTasksStatus(isNative);
      // 如果已登录但返回 null（可能 token 过期被降级为匿名），刷一次 token 重试
      if (!data && user) {
        console.log('[useDailyTasks] 已登录但返回 null，尝试刷新 token 重试');
        await ensureFreshToken();
        const retryData = await getDailyTasksStatus(isNative);
        setStatus(retryData);
      } else {
        setStatus(data);
      }
    } catch (err) {
      console.error('❌ [useDailyTasks] 加载状态失败:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isNative, user, ensureFreshToken]);

  // 初始化加载
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 自动弹窗已禁用，用户可通过入口手动打开
  // 如需恢复自动弹出，还原此处的条件判断逻辑

  const markPopupShown = useCallback(() => {}, []);
  const dismissPopup = useCallback(() => {}, []);

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

  // 签到（需要先观看激励视频广告）
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

      // 签到前需要先观看激励视频广告（Web 端使用 ExoClick VAST，原生端使用 AdMob/Appodeal）
      console.log('[useDailyTasks] 开始显示签到激励视频广告...');
      const adResult = await showRewardedAd();

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[useDailyTasks] 签到已被用户取消');
        return { success: false, message: '已取消' };
      }

      if (!adResult.success) {
        console.log('[useDailyTasks] 广告未完成，原因:', adResult.reason);
        // 根据原因返回不同的错误消息
        if (adResult.reason === 'unavailable') {
          return { success: false, message: '暂无可用广告，请稍后再试', reason: 'unavailable' };
        } else if (adResult.reason === 'skipped') {
          return { success: false, message: '请观看完整广告以完成签到', reason: 'skipped' };
        } else {
          return { success: false, message: adResult.message || '广告加载失败，请稍后再试', reason: 'error' };
        }
      }
      console.log('[useDailyTasks] 广告观看成功，开始签到...');

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[useDailyTasks] 签到已被用户取消');
        return { success: false, message: '已取消' };
      }

      // 调用签到接口（积分加到永久积分，并传递广告收益数据）
      const result = await checkin(true, isRealNativePlatform);
      if (result.success && !cancelledRef.current) {
        // 乐观更新：立即标记签到完成，防止重复点击
        setStatus(prev => prev ? {
          ...prev,
          checkinDone: true,
          checkinCredits: result.credits || 0,
          todayTotalCredits: prev.todayTotalCredits + (result.credits || 0),
        } : prev);
        refresh(); // 后台同步最新状态
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
  }, [refresh, showRewardedAd]);

  // 领取广告奖励
  const doClaimAdReward = useCallback(async (): Promise<TaskResult> => {
    try {
      cancelledRef.current = false;
      setClaiming(true);
      setError(null);

      // 清空旧的广告收益数据，等待新广告的 OnPaidEvent
      clearLastAdRevenue();

      // 显示激励广告
      console.log('[DailyTasks] 开始显示激励广告...');
      const adResult = await showRewardedAd();

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[DailyTasks] 广告奖励已被用户取消');
        return { success: false, message: '已取消' };
      }

      if (!adResult.success) {
        console.log('[DailyTasks] 广告未完成，原因:', adResult.reason);
        if (adResult.reason === 'unavailable') {
          return { success: false, message: '暂无可用广告，请稍后再试' };
        } else if (adResult.reason === 'skipped') {
          return { success: false, message: '请观看完整广告以获得奖励' };
        } else {
          return { success: false, message: adResult.message || '广告加载失败，请稍后再试' };
        }
      }

      // 检查是否已取消
      if (cancelledRef.current) {
        console.log('[DailyTasks] 广告奖励已被用户取消');
        return { success: false, message: '已取消' };
      }

      // 广告观看成功，领取奖励（从 ref 读取最新的广告收益数据，避免闭包旧值）
      const revenue = lastAdRevenueRef.current;
      console.log('[DailyTasks] 广告观看成功，领取奖励...', revenue ? `revenue: ${revenue.valueMicros} ${revenue.currencyCode}` : 'no revenue data');
      const result = await claimAdReward(true, true, isRealNativePlatform,
        revenue?.valueMicros, revenue?.currencyCode);
      if (result.success && !cancelledRef.current) {
        // 乐观更新：立即递增观看次数，防止 UI 闪烁
        setStatus(prev => prev ? {
          ...prev,
          adRewardsClaimed: prev.adRewardsClaimed + 1,
          adRewardsCredits: prev.adRewardsCredits + (result.credits || 0),
          todayTotalCredits: prev.todayTotalCredits + (result.credits || 0),
          remainingAdViews: Math.max(0, prev.remainingAdViews - 1),
        } : prev);
        refresh(); // 后台同步最新状态
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
  }, [refresh, showRewardedAd, clearLastAdRevenue]);

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