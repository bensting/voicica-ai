'use client';

/**
 * 首页横幅广告组件
 *
 * 使用 Adsterra Native Banner 广告
 * 订阅用户不显示广告，回退到 BannerCarousel
 */

import { useSubscription } from '@/contexts/SubscriptionContext';
import { activeLuckyDraw } from '@/config/native/luckyDrawConfig';
import AdsterraBanner from './AdsterraBanner';
import BannerCarousel from './BannerCarousel';
import LuckyDrawBanner from './LuckyDrawBanner';

/**
 * 首页横幅广告
 */
export default function NativeBannerAd() {
  const { isSubscribed } = useSubscription();

  // 活动开启时，所有用户看到活动 banner
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev ? activeLuckyDraw.enabled.development : activeLuckyDraw.enabled.production) {
    return <LuckyDrawBanner />;
  }

  // 订阅用户显示 BannerCarousel（不显示广告）
  if (isSubscribed) {
    return <BannerCarousel />;
  }

  // 非订阅用户显示 Adsterra 广告
  return <AdsterraBanner />;
}
