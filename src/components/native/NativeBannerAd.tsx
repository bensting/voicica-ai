'use client';

/**
 * 首页横幅广告组件
 *
 * 使用 Adsterra Native Banner 广告
 * 订阅用户不显示广告，回退到 BannerCarousel
 */

import { useSubscription } from '@/contexts/SubscriptionContext';
import { activeCampaign } from '@/config/native/campaignConfig';
import AdsterraBanner from './AdsterraBanner';
import BannerCarousel from './BannerCarousel';
import CampaignBanner from './CampaignBanner';

/**
 * 首页横幅广告
 */
export default function NativeBannerAd() {
  const { isSubscribed } = useSubscription();

  // 活动开启时，所有用户看到活动 banner
  if (activeCampaign.enabled) {
    return <CampaignBanner />;
  }

  // 订阅用户显示 BannerCarousel（不显示广告）
  if (isSubscribed) {
    return <BannerCarousel />;
  }

  // 非订阅用户显示 Adsterra 广告
  return <AdsterraBanner />;
}
