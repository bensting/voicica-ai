export interface CampaignConfig {
  id: string;
  /** 按环境控制是否展示 */
  enabled: { development: boolean; production: boolean };
  title: string;
  prize: string;
  /** 首页入口显示名，如 "Lucky Draw\nWin iPhone 17 Pro" */
  shortLabel: string;
  priceUsd: number;
  stripePriceUsd: number;
  cryptoPriceUsd: number;
  creditsPerPurchase: number;
  totalSlots: number;
  href: string;
  contractAddress: string;
  chainName: string;
  blockExplorerUrl: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 所有 campaign 列表
 * 首页 Lucky Draw 入口从此列表渲染（仅当前环境 enabled 的）
 */
export const campaigns: CampaignConfig[] = [
  {
    id: 'iphone17pro-launch',
    enabled: { development: true, production: true },
    title: 'AI CREATIVE FEST',
    prize: 'iPhone 17 Pro',
    shortLabel: 'Lucky Draw\nWin iPhone 17 Pro',
    priceUsd: 1,
    stripePriceUsd: 1.3,
    cryptoPriceUsd: 1.0,
    creditsPerPurchase: 100,
    totalSlots: 2000,
    href: '/native/campaign/iphone17pro-launch',
    contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    chainName: 'Polygon',
    blockExplorerUrl: 'https://polygonscan.com/address/0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  },
  {
    id: 'usdt-1000',
    enabled: { development: true, production: false },
    title: 'CRYPTO GIVEAWAY',
    prize: '1000 USDT',
    shortLabel: 'Lucky Draw\nWin 1000 USDT',
    priceUsd: 1,
    stripePriceUsd: 1.3,
    cryptoPriceUsd: 1.0,
    creditsPerPurchase: 100,
    totalSlots: 1500,
    href: '/native/campaign/usdt-1000',
    contractAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Polygon',
    blockExplorerUrl: '',
  },
];

/** 获取当前环境所有启用的 campaign */
export function getActiveCampaigns(): CampaignConfig[] {
  return campaigns.filter((c) =>
    isDevelopment ? c.enabled.development : c.enabled.production
  );
}

/** 向后兼容：获取第一个启用的 campaign */
export const activeCampaign: CampaignConfig = campaigns[0];
