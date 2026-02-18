/**
 * Lucky Draw 产品目录（静态配置）
 *
 * 定义产品的固有属性和默认参数（totalSlots、价格、积分等）。
 * 每期抽奖实例由 lucky_draws 表管理，通过 product_id 关联，
 * 创建时自动从此配置读取默认值。
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
  /** 每期总 Slots */
  totalSlots: number;
  /** 每包赠送积分 */
  creditsPerPurchase: number;
  /** Stripe 单价（美分） */
  stripePriceCents: number;
  /** Crypto 单价（美分） */
  cryptoPriceCents: number;
  /** 区块链名称 */
  chainName: string;
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
    totalSlots: 2000,
    creditsPerPurchase: 100,
    stripePriceCents: 100,
    cryptoPriceCents: 100,
    chainName: 'Polygon',
  },
  {
    productId: 'usdt-100',
    icon: 'coin',
    prizeType: 'cash',
    prize: '100 USDT',
    prizeImageUrl: '/images/campaign/usdt.png',
    shortLabel: 'Lucky Draw\nWin 1000 USDT',
    totalSlots: 120,
    creditsPerPurchase: 100,
    stripePriceCents: 100,
    cryptoPriceCents: 100,
    chainName: 'Polygon',
  },
];

/** Stripe 固定手续费（美分），每笔交易收取一次 */
export const STRIPE_PROCESSING_FEE_CENTS = 30;

/** 根据 productId 获取产品配置 */
export function getLuckyDrawProduct(productId: string): LuckyDrawProduct | undefined {
  return luckyDrawProducts.find((p) => p.productId === productId);
}

/** 产品图标映射（供 FeatureGrid 使用） */
export const luckyDrawIconMap: Record<LuckyDrawIcon, React.ReactNode> = {} as Record<LuckyDrawIcon, React.ReactNode>;
