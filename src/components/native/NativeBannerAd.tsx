'use client';

/**
 * 首页横幅广告组件
 *
 * 有活跃 Lucky Draw 时优先显示 Lucky Draw Banner（多个时轮播）
 * 订阅用户回退到 BannerCarousel，非订阅回退到 AdsterraBanner
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getActiveDrawsForBanner, type ActiveDrawInfo } from '@/actions/lucky-draw';
import { getMiningEconomyConfig } from '@/config/appConfig';
import AdsterraBanner from './AdsterraBanner';
import BannerCarousel from './BannerCarousel';
import LuckyDrawBanner from './LuckyDrawBanner';

export default function NativeBannerAd() {
  const { show_home_banner } = getMiningEconomyConfig();
  if (!show_home_banner) return null;
  const { isSubscribed } = useSubscription();
  const [activeDraws, setActiveDraws] = useState<ActiveDrawInfo[] | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    getActiveDrawsForBanner()
      .then((draws) => setActiveDraws(draws))
      .catch(() => setActiveDraws([]));
    const interval = setInterval(() => {
      getActiveDrawsForBanner()
        .then((draws) => setActiveDraws(draws))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate every 5s when multiple draws
  useEffect(() => {
    if (!activeDraws || activeDraws.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeDraws.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeDraws]);

  const goToNext = useCallback(() => {
    if (!activeDraws || activeDraws.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeDraws.length);
  }, [activeDraws]);

  const goToPrev = useCallback(() => {
    if (!activeDraws || activeDraws.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeDraws.length) % activeDraws.length);
  }, [activeDraws]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  }, [goToNext, goToPrev]);

  // Loading
  if (activeDraws === undefined) return (
    <div className="mx-4 rounded-2xl bg-white/5 animate-pulse" style={{ height: 220 }} />
  );

  // No active draws — fallback
  if (activeDraws.length === 0) {
    if (isSubscribed) return <BannerCarousel />;
    return <AdsterraBanner />;
  }

  // Single draw — no carousel needed
  if (activeDraws.length === 1) {
    return (
      <div className="px-4">
        <LuckyDrawBanner draw={activeDraws[0]} />
      </div>
    );
  }

  // Multiple draws — carousel with swipe + auto-rotate + dots
  return (
    <div className="px-4">
      <div
        className="relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {activeDraws.map((draw) => (
              <div key={draw.drawId} className="w-full flex-shrink-0">
                <LuckyDrawBanner draw={draw} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {activeDraws.map((draw, index) => (
            <button
              key={draw.drawId}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/40'
              }`}
              aria-label={`Go to draw ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
