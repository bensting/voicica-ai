import NativeBannerAd from '@/components/native/NativeBannerAd';
import TotalAssetsCard from '@/components/native/TotalAssetsCard';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';

/**
 * Native App 首页
 * 包含原生广告横幅、资产总览、功能入口、Explore 内容
 */
export default function NativePage() {
  return (
    <div className="pt-2 pb-20">
      {/* 首页横幅原生广告 */}
      <NativeBannerAd />

      {/* 资产总览卡片 */}
      <TotalAssetsCard />

      {/* 功能入口四宫格 */}
      <FeatureGrid />

      {/* Explore 区域 */}
      <ExploreSection />
    </div>
  );
}
