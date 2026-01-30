/**
 * 原生 App 安全返回 Hook
 *
 * 简化版：直接使用 router.back()，仅在完全没有历史时才使用 fallback
 * 这种方式在 WebView/原生应用中更可靠
 */
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_FALLBACK = '/native';

/**
 * 安全的返回导航 hook
 * @param fallbackPath 没有历史时的回退路径，默认为 /native
 */
export function useNativeBack(fallbackPath: string = DEFAULT_FALLBACK) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      // 只有当历史长度为 1（没有可返回的页面）时才使用 fallback
      if (window.history.length <= 1) {
        router.push(fallbackPath);
        return;
      }
    }

    // 正常返回上一页
    router.back();
  }, [router, fallbackPath]);

  return goBack;
}

export default useNativeBack;
