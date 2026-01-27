'use client';

import { useCallback, useRef } from 'react';
import { getPopunderConfig, isPopunderEnabled } from '@/config/ads/adsterra';

const POPUNDER_COOLDOWN_KEY = 'popunder_last_triggered';

/**
 * Popunder 广告 Hook
 *
 * 用于在特定用户操作时触发 Popunder 广告
 * 24小时内只会触发一次
 *
 * @example
 * ```tsx
 * const { triggerPopunder, canTrigger } = usePopunder();
 *
 * const handleDownload = () => {
 *   triggerPopunder(); // 触发广告
 *   doDownload();      // 执行下载
 * };
 * ```
 */
export function usePopunder() {
  const scriptLoadedRef = useRef(false);

  /**
   * 检查是否在冷却期内
   */
  const isInCooldown = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;

    const config = getPopunderConfig();
    const lastTriggered = localStorage.getItem(POPUNDER_COOLDOWN_KEY);
    if (!lastTriggered) return false;

    const lastTime = parseInt(lastTriggered, 10);
    const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
    return Date.now() - lastTime < cooldownMs;
  }, []);

  /**
   * 记录触发时间
   */
  const recordTrigger = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(POPUNDER_COOLDOWN_KEY, String(Date.now()));
  }, []);

  /**
   * 触发 Popunder 广告
   * 必须在用户点击事件中调用
   */
  const triggerPopunder = useCallback(() => {
    // 检查是否启用
    if (!isPopunderEnabled()) {
      console.log('[Popunder] Disabled in config');
      return false;
    }

    // 检查冷却期
    if (isInCooldown()) {
      console.log('[Popunder] Still in cooldown period, skipping');
      return false;
    }

    // 检查脚本是否已加载
    if (scriptLoadedRef.current) {
      console.log('[Popunder] Script already loaded');
      return false;
    }

    const config = getPopunderConfig();

    // 检查是否已存在脚本
    const existingScript = document.querySelector(`script[src="${config.scriptUrl}"]`);
    if (existingScript) {
      console.log('[Popunder] Script already exists');
      scriptLoadedRef.current = true;
      return false;
    }

    // 动态加载脚本 - 必须在用户点击事件中执行
    const script = document.createElement('script');
    script.src = config.scriptUrl;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      scriptLoadedRef.current = true;
      recordTrigger();
      console.log('[Popunder] Script loaded and triggered');
    };

    script.onerror = () => {
      console.error('[Popunder] Failed to load script');
    };

    // 添加到 head
    document.head.appendChild(script);

    return true;
  }, [isInCooldown, recordTrigger]);

  /**
   * 是否可以触发（未在冷却期）
   */
  const canTrigger = !isInCooldown();

  return {
    triggerPopunder,
    canTrigger,
    isInCooldown: isInCooldown(),
  };
}
