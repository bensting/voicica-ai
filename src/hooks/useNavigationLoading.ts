'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 共享导航 loading 状态 hook
 * 点击导航时调用 startLoading()，pathname 变化后自动清除
 */
export function useNavigationLoading() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (navigating) setNavigating(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const startLoading = useCallback(() => setNavigating(true), []);

  return { navigating, startLoading };
}
