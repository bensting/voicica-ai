/**
 * Google Play Billing 配置
 *
 * Product ID 需要与 Google Play Console 中创建的订阅产品 ID 一致
 */

export const googlePlayProducts = {
  starter: {
    // Google Play 产品 ID (与 Google Play Console 一致)
    productId: 'starter_monthly',
    // 对应的 Stripe 产品 ID
    stripeProductId: 'prod_starter_1k',
    // 积分数
    credits: 1000,
  },
  creator: {
    productId: 'creator_monthly',
    stripeProductId: 'prod_creator_3k',
    credits: 3000,
  },
  pro: {
    productId: 'pro_monthly',
    stripeProductId: 'prod_pro_5k',
    credits: 5000,
  },
};

/**
 * 根据 Stripe Product ID 获取 Google Play Product ID
 */
export function getGooglePlayProductId(stripeProductId: string): string | null {
  for (const product of Object.values(googlePlayProducts)) {
    if (product.stripeProductId === stripeProductId) {
      return product.productId;
    }
  }
  return null;
}
