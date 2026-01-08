'use client';

/**
 * Google Play Billing Hook
 *
 * 用于 Android 应用内购买
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getGooglePlayProductId } from '@/config/payment/google-play';

interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  purchaseToken?: string;
  orderId?: string;
  productId?: string;
  error?: string;
}

interface UseGooglePlayBillingReturn {
  /** 是否已初始化 */
  isReady: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 购买产品 */
  purchase: (productId: string) => Promise<PurchaseResult>;
  /** 恢复购买 */
  restorePurchases: () => Promise<boolean>;
  /** 是否应该使用 Google Play Billing (Android 原生平台) */
  shouldUseGooglePlay: boolean;
}

export function useGooglePlayBilling(): UseGooglePlayBillingReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pluginRef = useRef<typeof import('@/plugins/google-play-billing').GooglePlayBilling | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const shouldUseGooglePlay = isNative && platform === 'android';

  // 初始化
  useEffect(() => {
    if (!shouldUseGooglePlay) return;

    const init = async () => {
      try {
        const { GooglePlayBilling } = await import('@/plugins/google-play-billing');
        pluginRef.current = GooglePlayBilling;

        // 检查连接状态
        const { ready } = await GooglePlayBilling.isReady();
        setIsReady(ready);
        console.log('[GooglePlayBilling] Ready:', ready);
      } catch (err) {
        console.error('[GooglePlayBilling] Init failed:', err);
        setError('Failed to initialize billing');
      }
    };

    init();
  }, [shouldUseGooglePlay]);

  // 购买产品 (接受 Stripe Product ID，自动转换为 Google Play Product ID)
  const purchase = useCallback(async (stripeProductId: string): Promise<PurchaseResult> => {
    if (!pluginRef.current) {
      return { success: false, error: 'Billing not initialized' };
    }

    // 转换产品 ID
    const googlePlayProductId = getGooglePlayProductId(stripeProductId) || stripeProductId;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[GooglePlayBilling] Purchase:', googlePlayProductId, '(from:', stripeProductId, ')');
      const result = await pluginRef.current.purchase({ productId: googlePlayProductId });

      setIsLoading(false);

      if (result.success) {
        console.log('[GooglePlayBilling] Purchase successful:', result);
        return {
          success: true,
          purchaseToken: result.purchaseToken,
          orderId: result.orderId,
          productId: result.productId,
        };
      } else if (result.cancelled) {
        console.log('[GooglePlayBilling] Purchase cancelled');
        return { success: false, cancelled: true };
      } else {
        return { success: false, error: 'Purchase failed' };
      }
    } catch (err: unknown) {
      console.error('[GooglePlayBilling] Purchase error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 恢复购买
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!pluginRef.current) {
      return false;
    }

    setIsLoading(true);
    try {
      const result = await pluginRef.current.restorePurchases();
      console.log('[GooglePlayBilling] Restore:', result);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[GooglePlayBilling] Restore error:', err);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isReady,
    isLoading,
    error,
    purchase,
    restorePurchases,
    shouldUseGooglePlay,
  };
}
