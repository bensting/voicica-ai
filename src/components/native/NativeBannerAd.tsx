'use client';

/**
 * 首页横幅广告组件
 *
 * 支持两种广告类型：
 * 1. Banner 广告 - 固定在屏幕顶部，点击正常工作
 * 2. 原生广告 - 在内容中显示，但点击不工作
 *
 * 优先使用 Banner 广告，如果禁用则使用原生广告，都禁用则显示 BannerCarousel
 */

import { useEffect } from 'react';
import { useNativeBannerAd, type NativeAdData } from '@/hooks/useNativeBannerAd';
import { useBannerAd } from '@/hooks/useBannerAd';
import { isBannerAdEnabled, isAdMobNativeBannerEnabled } from '@/config/ads';
import BannerCarousel from './BannerCarousel';

/**
 * 首页横幅广告
 */
export default function NativeBannerAd() {
  const bannerAdEnabled = isBannerAdEnabled();
  const nativeBannerEnabled = isAdMobNativeBannerEnabled();

  // 如果 Banner 广告启用，使用 Banner 广告
  if (bannerAdEnabled) {
    return <BannerAdContent />;
  }

  // 如果原生广告启用，使用原生广告
  if (nativeBannerEnabled) {
    return <NativeAdContent />;
  }

  // 都禁用，显示 BannerCarousel
  return <BannerCarousel />;
}

/**
 * Banner 广告内容（固定在顶部）
 */
function BannerAdContent() {
  const { isEnabled, status } = useBannerAd();

  // 未启用时显示 BannerCarousel
  if (!isEnabled) {
    return <BannerCarousel />;
  }

  // Banner 广告是固定在屏幕顶部的覆盖层
  // 这里只需要返回 BannerCarousel 作为内容区域的填充
  // 实际的 Banner 由 AdMob SDK 在原生层渲染

  // 加载中或加载失败时显示 BannerCarousel
  if (status === 'loading' || status === 'idle' || status === 'error') {
    return <BannerCarousel />;
  }

  // Banner 显示成功后，返回 BannerCarousel（因为 Banner 是覆盖层，不占用内容空间）
  // 或者可以返回一个占位 div
  return <BannerCarousel />;
}

/**
 * 原生广告内容（在页面内容中）
 */
function NativeAdContent() {
  const { isEnabled, adData, status, recordClick, recordImpression } = useNativeBannerAd();

  // 记录广告展示
  useEffect(() => {
    if (status === 'loaded' && adData) {
      recordImpression();
    }
  }, [status, adData, recordImpression]);

  // 未启用时显示 BannerCarousel
  if (!isEnabled) {
    return <BannerCarousel />;
  }

  // 加载中显示骨架屏
  if (status === 'loading' || status === 'idle') {
    return <BannerSkeleton />;
  }

  // 加载失败时回退到 BannerCarousel
  if (status === 'error' || !adData) {
    return <BannerCarousel />;
  }

  // 处理广告点击
  const handleAdClick = () => {
    recordClick();
  };

  return (
    <div className="px-4">
      <div
        onClick={handleAdClick}
        className="relative overflow-hidden rounded-2xl h-44 cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* 背景 */}
        <BannerBackground adData={adData} />

        {/* 内容 */}
        <div className="relative z-10 flex h-full p-5">
          {/* 左侧文字内容 */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Ad 标签 */}
            <span className="inline-flex items-center w-fit text-[10px] px-2 py-0.5 bg-white/20 text-white/90 rounded-full font-medium mb-2">
              Ad
            </span>

            {/* 标题 */}
            <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
              {adData.headline || 'Sponsored'}
            </h2>

            {/* 描述 */}
            <p className="text-sm text-gray-200 mb-3 max-w-[220px] line-clamp-2">
              {adData.body || adData.advertiser || 'Discover something new'}
            </p>

            {/* CTA 按钮 */}
            <button className="inline-flex items-center justify-center w-fit px-5 py-2.5 text-sm font-semibold text-purple-900 bg-white/90 rounded-full hover:bg-white transition-colors">
              {adData.callToAction || 'Learn More'}
            </button>
          </div>

          {/* 右侧图标/评分 */}
          <div className="flex flex-col items-end justify-center ml-4">
            {/* 图标 */}
            {adData.iconUrl && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={adData.iconUrl}
                  alt="Ad icon"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 星级评分 */}
            {adData.starRating && adData.starRating > 0 && (
              <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                <StarIcon />
                <span className="text-white text-xs font-medium">
                  {adData.starRating.toFixed(1)}
                </span>
              </div>
            )}

            {/* 商店来源 */}
            {adData.store && (
              <span className="text-white/60 text-xs mt-1">{adData.store}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 横幅背景
 */
function BannerBackground({ adData }: { adData: NativeAdData }) {
  // 如果有图片，使用图片作为背景
  if (adData.imageUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={adData.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 遮罩层，保证文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
      </>
    );
  }

  // 无图片时的默认渐变
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
      <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
    </>
  );
}

/**
 * 星星图标
 */
function StarIcon() {
  return (
    <svg className="w-3 h-3 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/**
 * 加载骨架屏
 */
function BannerSkeleton() {
  return (
    <div className="px-4">
      <div className="relative overflow-hidden rounded-2xl h-44 bg-gradient-to-r from-purple-600/50 to-pink-600/50">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center h-full p-5">
          <div className="h-4 w-12 bg-white/20 rounded-full animate-pulse mb-3" />
          <div className="h-6 w-40 bg-white/30 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse mb-4" />
          <div className="h-10 w-28 bg-white/40 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
