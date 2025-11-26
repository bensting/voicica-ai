'use client';

import { useEffect } from 'react';
import { initCapacitor, isNativeApp, onBackButton } from '@/lib/capacitor';
import { useRouter } from 'next/navigation';

/**
 * Capacitor Provider
 * 初始化 Capacitor 并处理原生事件
 */
export default function CapacitorProvider() {
  const router = useRouter();

  useEffect(() => {
    // 初始化 Capacitor
    initCapacitor();

    // 处理 Android 返回按钮
    const cleanup = onBackButton(() => {
      // 检查是否可以后退
      if (window.history.length > 1) {
        router.back();
      }
    });

    // 记录平台信息
    if (isNativeApp()) {
      console.log('📱 Running in native app');
    }

    return cleanup;
  }, [router]);

  return null;
}