'use client';

/**
 * 首页横幅广告组件
 *
 * 使用 Adsterra Native Banner 广告
 * 订阅用户不显示广告，回退到 BannerCarousel
 * 有活跃 Lucky Draw 时优先显示 Lucky Draw Banner
 */

import { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getActiveDraw, type ActiveDrawInfo } from '@/actions/lucky-draw';
import AdsterraBanner from './AdsterraBanner';
import BannerCarousel from './BannerCarousel';
import LuckyDrawBanner from './LuckyDrawBanner';

/**
 * 首页横幅广告
 */
export default function NativeBannerAd() {
  const { isSubscribed } = useSubscription();
  const [activeDraw, setActiveDraw] = useState<ActiveDrawInfo | null | undefined>(undefined);

  useEffect(() => {
    getActiveDraw()
      .then(setActiveDraw)
      .catch(() => setActiveDraw(null));
    // Poll every 30s to keep soldSlots / remaining fresh
    const interval = setInterval(() => {
      getActiveDraw()
        .then(setActiveDraw)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Loading — skeleton placeholder
  if (activeDraw === undefined) return (
    <div className="mx-4 rounded-2xl bg-white/5 animate-pulse" style={{ height: 220 }} />
  );

  // Active draw exists — show Lucky Draw banner
  if (activeDraw) return <LuckyDrawBanner draw={activeDraw} />;

  // No active draw — fallback
  if (isSubscribed) return <BannerCarousel />;
  return <AdsterraBanner />;
}
