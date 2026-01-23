'use client';

import {
  StudioBannerCarousel,
  StudioFeatureGrid,
  StudioExploreSection,
} from '@/components/features/studio/home';

export default function StudioPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
      {/* Banner 轮播 */}
      <StudioBannerCarousel />

      {/* 功能入口网格 */}
      <StudioFeatureGrid />

      {/* Explore 区域 */}
      <StudioExploreSection />
    </div>
  );
}
