/**
 * 产品类型路由配置
 *
 * 定义不同产品类型对应的导航路径
 */

export type ProductType = 'text_to_speech' | 'voice_cloning';

/**
 * 产品类型到路由的映射
 */
export const PRODUCT_ROUTES: Record<ProductType, string> = {
  text_to_speech: '/native/create/voice',
  voice_cloning: '/native/create/voice',
};

/**
 * 获取产品类型对应的路由路径
 * @param productType - 产品类型
 * @returns 路由路径
 */
export function getProductRoute(productType: string | undefined): string {
  if (!productType) {
    return PRODUCT_ROUTES.text_to_speech; // 默认返回 TTS 页面
  }

  const route = PRODUCT_ROUTES[productType as ProductType];
  return route || PRODUCT_ROUTES.text_to_speech; // 如果找不到对应路由，返回默认路由
}