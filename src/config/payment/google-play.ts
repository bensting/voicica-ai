/**
 * Google Play Billing 配置
 *
 * Product ID 需要与 Google Play Console 中创建的订阅产品 ID 一致
 */

export const googlePlayProducts = {
  starter: {
    // Google Play 产品 ID
    productId: 'starter_monthly_100k',
    // 对应的 Stripe 产品 ID
    stripeProductId: 'prod_starter_100k',
    // 积分数
    credits: 100000,
  },
  creator: {
    productId: 'creator_monthly_300k',
    stripeProductId: 'prod_creator_300k',
    credits: 300000,
  },
  pro: {
    productId: 'pro_monthly_500k',
    stripeProductId: 'prod_pro_500k',
    credits: 500000,
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
