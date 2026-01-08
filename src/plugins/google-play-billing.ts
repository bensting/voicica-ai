/**
 * Google Play Billing Plugin TypeScript Definitions
 */

import { registerPlugin } from '@capacitor/core';

export interface GooglePlayBillingPlugin {
  /**
   * 检查是否已连接
   */
  isReady(): Promise<{ ready: boolean }>;

  /**
   * 获取产品信息
   * @param options productIds: 逗号分隔的产品 ID
   */
  getProducts(options: { productIds: string }): Promise<{ products: string }>;

  /**
   * 发起购买
   * @param options productId: 产品 ID
   */
  purchase(options: { productId: string }): Promise<PurchaseResult>;

  /**
   * 恢复购买
   */
  restorePurchases(): Promise<{ purchases: string }>;
}

export interface PurchaseResult {
  success: boolean;
  cancelled: boolean;
  purchaseToken?: string;
  orderId?: string;
  productId?: string;
}

export interface ProductInfo {
  productId: string;
  name: string;
  title: string;
  price?: string;
  priceAmountMicros?: number;
  priceCurrencyCode?: string;
}

export interface PurchaseInfo {
  productId: string;
  purchaseToken: string;
  orderId: string;
}

export const GooglePlayBilling = registerPlugin<GooglePlayBillingPlugin>('GooglePlayBilling');
