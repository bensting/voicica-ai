'use client';

/**
 * 匿名用户 TTS 每日限制 Hook
 *
 * 使用 localStorage 追踪匿名用户每日 TTS 生成次数，
 * 达到限制后引导用户登录。
 */

import { useState, useCallback, useEffect } from 'react';
import { getAnonymousUserConfig } from '@/config/appConfig';

const STORAGE_KEY = 'anonymous_tts_usage';

interface UsageData {
  date: string;
  count: number;
}

interface UseAnonymousTTSLimitReturn {
  /** 今日已使用次数 */
  usedCount: number;
  /** 每日限制次数 */
  dailyLimit: number;
  /** 剩余次数 */
  remainingCount: number;
  /** 是否已达到限制 */
  isLimitReached: boolean;
  /** 增加使用次数（生成成功后调用） */
  incrementUsage: () => void;
  /** 检查是否可以生成（返回 true 表示可以，false 表示需要登录） */
  canGenerate: () => boolean;
}

/**
 * 获取今天的日期字符串（用于比较）
 */
function getTodayString(): string {
  return new Date().toDateString();
}

/**
 * 从 localStorage 获取使用数据
 */
function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return { date: '', count: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as UsageData;
      // 检查是否是今天的数据
      if (data.date === getTodayString()) {
        return data;
      }
    }
  } catch (err) {
    console.error('[useAnonymousTTSLimit] Failed to parse usage data:', err);
  }

  // 返回默认值（新的一天或无数据）
  return { date: getTodayString(), count: 0 };
}

/**
 * 保存使用数据到 localStorage
 */
function saveUsageData(data: UsageData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[useAnonymousTTSLimit] Failed to save usage data:', err);
  }
}

/**
 * 匿名用户 TTS 每日限制 Hook
 */
export function useAnonymousTTSLimit(): UseAnonymousTTSLimitReturn {
  const config = getAnonymousUserConfig();
  const dailyLimit = config.tts_daily_limit;

  const [usedCount, setUsedCount] = useState<number>(0);

  // 初始化时从 localStorage 加载
  useEffect(() => {
    const data = getUsageData();
    setUsedCount(data.count);
  }, []);

  // 计算剩余次数
  const remainingCount = Math.max(0, dailyLimit - usedCount);
  const isLimitReached = usedCount >= dailyLimit;

  // 增加使用次数
  const incrementUsage = useCallback(() => {
    const today = getTodayString();
    const currentData = getUsageData();

    // 如果是新的一天，重置计数
    const newCount = currentData.date === today ? currentData.count + 1 : 1;

    const newData: UsageData = {
      date: today,
      count: newCount,
    };

    saveUsageData(newData);
    setUsedCount(newCount);

    console.log('[useAnonymousTTSLimit] Usage incremented:', newData);
  }, []);

  // 检查是否可以生成
  const canGenerate = useCallback((): boolean => {
    const data = getUsageData();
    const today = getTodayString();

    // 如果是新的一天，可以生成
    if (data.date !== today) {
      return true;
    }

    // 检查是否达到限制
    return data.count < dailyLimit;
  }, [dailyLimit]);

  return {
    usedCount,
    dailyLimit,
    remainingCount,
    isLimitReached,
    incrementUsage,
    canGenerate,
  };
}
