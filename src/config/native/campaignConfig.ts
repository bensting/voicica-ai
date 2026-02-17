export interface CampaignConfig {
  id: string;
  enabled: boolean;
  title: string;
  prize: string;
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

export const activeCampaign: CampaignConfig = {
  id: 'iphone17pro-launch',
  enabled: true,
  title: 'AI CREATIVE FEST',
  prize: 'iPhone 17 Pro',
  priceUsd: 1,
  stripePriceUsd: 1.3,
  cryptoPriceUsd: 1.0,
  creditsPerPurchase: 100,
  totalSlots: 2000,
  href: '/native/campaign/iphone17pro-launch',
  contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  chainName: 'Polygon',
  blockExplorerUrl: 'https://polygonscan.com/address/0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
};
