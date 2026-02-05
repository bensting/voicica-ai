import NativeBannerAd from '@/components/native/NativeBannerAd';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';

/**
 * Native App 首页
 * 包含原生广告横幅、功能入口、Explore 内容
 */
export default function NativePage() {
  return (
    <div className="pt-2">
      {/* 首页横幅原生广告 */}
      <NativeBannerAd />

      {/* 功能入口四宫格 */}
      <FeatureGrid />

      {/* Explore 区域 */}
      <ExploreSection />
    </div>
  );
}
