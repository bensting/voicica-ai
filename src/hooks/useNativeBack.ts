/**
 * 原生 App 安全返回 Hook
 *
 * 问题：当用户直接进入某个页面（没有导航历史）时，router.back() 不工作
 * 解决：检测是否有历史记录，如果没有则导航到默认页面
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_FALLBACK = '/native';

/**
 * 安全的返回导航 hook
 * @param fallbackPath 没有历史时的回退路径，默认为 /native
 */
export function useNativeBack(fallbackPath: string = DEFAULT_FALLBACK) {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  const initialHistoryLengthRef = useRef<number | null>(null);

  // 记录初始历史长度
  useEffect(() => {
    if (typeof window !== 'undefined' && initialHistoryLengthRef.current === null) {
      initialHistoryLengthRef.current = window.history.length;
    }
  }, []);

  // 监听路由变化，标记已导航
  useEffect(() => {
    // 如果历史长度增加了，说明有导航发生
    const checkNavigation = () => {
      if (initialHistoryLengthRef.current !== null) {
        hasNavigatedRef.current = window.history.length > initialHistoryLengthRef.current;
      }
    };

    // 延迟检查，确保路由变化后更新
    const timer = setTimeout(checkNavigation, 100);
    return () => clearTimeout(timer);
  }, []);

  const goBack = useCallback(() => {
    // 检查是否有可以返回的历史
    // history.length > 1 表示有多于一个条目（当前页面 + 之前的页面）
    // 但这不完全可靠，因为 history.length 包含所有历史，不只是我们 app 的

    // 更可靠的方法：尝试返回，如果失败则跳转到 fallback
    // 但 router.back() 不返回 Promise，所以我们用其他方式

    if (typeof window !== 'undefined') {
      // 如果 referrer 是空的或者不是我们的域名，说明可能是直接进入的
      const referrer = document.referrer;
      const isDirectEntry = !referrer || !referrer.includes(window.location.host);

      // 如果是直接进入且历史长度很短，使用 fallback
      if (isDirectEntry && window.history.length <= 2) {
        router.push(fallbackPath);
        return;
      }
    }

    // 正常返回
    router.back();
  }, [router, fallbackPath]);

  return goBack;
}

export default useNativeBack;
