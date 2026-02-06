'use client';

/**
 * 原生广告卡片组件
 *
 * 设计为与 VoiceCard 风格一致，融入 Explore 列表
 * 使用自定义 Capacitor 插件显示 AdMob 原生高级广告
 */

import { useEffect } from 'react';
import { useNativeAd, type NativeAdData } from '@/hooks/useNativeAd';

interface NativeAdCardProps {
  /** 广告在列表中的索引（用于渐变色） */
  index?: number;
}

// 随机渐变色（与 VoiceCard 保持一致）
const gradients = [
  'from-purple-600 to-pink-600',
  'from-blue-600 to-cyan-600',
  'from-amber-600 to-orange-600',
  'from-green-600 to-teal-600',
  'from-indigo-600 to-purple-600',
  'from-rose-600 to-pink-600',
];

/**
 * 原生广告卡片
 *
 * 特点：
 * - 与 VoiceCard 风格一致
 * - 明确标注 "Ad" 标识
 * - 显示来自 AdMob 的原生广告内容
 * - 仅在原生环境显示
 */
export default function NativeAdCard({ index = 0 }: NativeAdCardProps) {
  const { isEnabled, adData, status, recordClick, recordImpression } = useNativeAd();
  const gradient = gradients[index % gradients.length];

  // 记录广告展示
  useEffect(() => {
    if (status === 'loaded' && adData) {
      recordImpression();
    }
  }, [status, adData, recordImpression]);

  // 未启用或加载失败时不显示
  if (!isEnabled) {
    return null;
  }

  // 加载中显示骨架屏
  if (status === 'loading' || status === 'idle') {
    return <NativeAdSkeleton gradient={gradient} />;
  }

  // 加载失败时不显示
  if (status === 'error' || !adData) {
    return null;
  }

  // 处理广告点击
  const handleAdClick = () => {
    recordClick();
  };

  return (
    <div
      onClick={handleAdClick}
      className="relative rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-gray-800/50 border border-gray-700/50 p-2.5"
    >
      {/* 顶部：图标 + 信息 + CTA */}
      <div className="flex items-center gap-2 mb-2">
        {/* 广告图标 */}
        <AdIcon adData={adData} gradient={gradient} />

        {/* 广告信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white text-xs font-medium truncate">
              {adData.headline || 'Sponsored'}
            </p>
            {/* Ad 标签 */}
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-medium flex-shrink-0">
              Ad
            </span>
          </div>
          <p className="text-gray-500 text-[10px] mt-0.5 truncate">
            {adData.advertiser || 'Advertisement'}
          </p>
        </div>

        {/* CTA 按钮 */}
        <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
          <span className="text-white text-[10px] font-medium">
            {adData.callToAction || 'Learn More'}
          </span>
        </div>
      </div>

      {/* 广告内容区域 */}
      <AdContent adData={adData} />

      {/* 星级评分 */}
      {adData.starRating && adData.starRating > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <StarRating rating={adData.starRating} />
          {adData.store && (
            <span className="text-gray-500 text-[10px]">{adData.store}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 广告图标组件
 */
function AdIcon({ adData, gradient }: { adData: NativeAdData; gradient: string }) {
  if (adData.iconUrl) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={adData.iconUrl}
          alt="Ad icon"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${gradient}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white/80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    </div>
  );
}

/**
 * 广告内容区域
 */
function AdContent({ adData }: { adData: NativeAdData }) {
  // 如果有图片，显示图片
  if (adData.imageUrl) {
    return (
      <div className="relative h-16 rounded-lg overflow-hidden bg-gray-700/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={adData.imageUrl}
          alt="Ad content"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 否则显示正文
  return (
    <p className="text-gray-400 text-[11px] line-clamp-2">
      {adData.body || 'Discover amazing apps tailored for you'}
    </p>
  );
}

/**
 * 星级评分组件
 */
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-2.5 h-2.5 ${
            i < fullStars
              ? 'text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'text-yellow-400/50'
              : 'text-gray-600'
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-gray-500 text-[10px] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * 加载骨架屏
 */
function NativeAdSkeleton({ gradient }: { gradient: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 p-2.5">
      {/* 顶部骨架 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} animate-pulse`} />
        <div className="flex-1">
          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-2.5 w-14 bg-gray-700/50 rounded animate-pulse" />
        </div>
        <div className="w-16 h-6 rounded-full bg-gray-700 animate-pulse" />
      </div>

      {/* 内容骨架 */}
      <div className="h-2.5 w-full bg-gray-700/30 rounded animate-pulse" />
    </div>
  );
}
