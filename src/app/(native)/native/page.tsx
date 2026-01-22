import BannerCarousel from '@/components/native/BannerCarousel';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';

/**
 * Native App 首页
 * 包含 Banner 轮播、功能入口、Explore 内容
 */
export default function NativePage() {
  return (
    <div className="pt-2">
      {/* Banner 轮播 */}
      <BannerCarousel />

      {/* 功能入口四宫格 */}
      <FeatureGrid />

      {/* Explore 区域 */}
      <ExploreSection />
    </div>
  );
}
