/**
 * Lucky Draw 产品目录（静态配置）
 *
 * 只定义产品的固有属性，不包含任何动态数据（如 totalSlots、价格、状态等）。
 * 动态数据由 lucky_draws 表管理，通过 product_id 关联。
 */

/** 首页入口图标类型 */
export type LuckyDrawIcon = 'trophy' | 'coin';

/** 奖品类型: product=实物(需收货地址), cash=现金/加密货币(需钱包或收款信息) */
export type PrizeType = 'product' | 'cash';

export interface LuckyDrawProduct {
  productId: string;
  icon: LuckyDrawIcon;
  prizeType: PrizeType;
  prize: string;
  prizeImageUrl: string;
  /** 首页入口显示名，如 "Lucky Draw\nWin iPhone 17 Pro" */
  shortLabel: string;
}

/** 所有 Lucky Draw 产品 */
export const luckyDrawProducts: LuckyDrawProduct[] = [
  {
    productId: 'iphone17pro',
    icon: 'trophy',
    prizeType: 'product',
    prize: 'iPhone 17 Pro',
    prizeImageUrl: '/images/campaign/iphone17pro.png',
    shortLabel: 'Lucky Draw\nWin iPhone 17 Pro',
  },
  {
    productId: 'usdt-1000',
    icon: 'coin',
    prizeType: 'cash',
    prize: '1000 USDT',
    prizeImageUrl: '/images/campaign/usdt.png',
    shortLabel: 'Lucky Draw\nWin 1000 USDT',
  },
];

/** 根据 productId 获取产品配置 */
export function getLuckyDrawProduct(productId: string): LuckyDrawProduct | undefined {
  return luckyDrawProducts.find((p) => p.productId === productId);
}

/** 产品图标映射（供 FeatureGrid 使用） */
export const luckyDrawIconMap: Record<LuckyDrawIcon, React.ReactNode> = {} as Record<LuckyDrawIcon, React.ReactNode>;
