'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApiBanner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  buttonTexts: Record<string, string> | null;
}

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
}

// 缓存相关常量
const BANNER_CACHE_KEY = 'native_banners_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时（毫秒）

interface BannerCache {
  data: ApiBanner[];
  timestamp: number;
}

// 从 localStorage 读取缓存
function getCachedBanners(): ApiBanner[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(BANNER_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: BannerCache = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否在24小时内
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // 缓存过期，删除
    localStorage.removeItem(BANNER_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

// 保存到 localStorage 缓存
function setCachedBanners(data: ApiBanner[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cache: BannerCache = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 可能已满或不可用，忽略错误
  }
}

/**
 * Banner 轮播组件
 * 从 API 加载数据，支持多语言、自动轮播和手动滑动切换
 */
export default function BannerCarousel() {
  const { locale, t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 触摸滑动相关
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  // 获取本地化文本，带回退
  const getLocalizedText = useCallback(
    (texts: Record<string, string> | null, fallback: string = ''): string => {
      if (!texts) return fallback;
      // 优先使用当前语言，然后回退到英文，最后使用任何可用的语言
      return texts[locale] || texts['en-US'] || Object.values(texts)[0] || fallback;
    },
    [locale]
  );

  // 将 API 数据转换为本地化 Banner
  const transformBanners = useCallback(
    (apiBanners: ApiBanner[]): Banner[] => {
      return apiBanners.map((b) => ({
        id: b.id,
        title: getLocalizedText(b.titles, ''),
        subtitle: getLocalizedText(b.subtitles, ''),
        buttonText: getLocalizedText(b.buttonTexts, t('native.common.learnMore') || 'Learn More'),
        buttonLink: b.linkUrl || '#',
        image: b.imageUrl,
      }));
    },
    [getLocalizedText, t]
  );

  // 加载 Banner 数据（带24小时缓存）
  useEffect(() => {
    // 先检查缓存
    const cached = getCachedBanners();
    if (cached) {
      setBanners(transformBanners(cached));
      setIsLoading(false);
      return;
    }

    // 无缓存或缓存过期，从 API 加载
    fetch('/api/v1/native/banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.banners) {
          // 保存到缓存
          setCachedBanners(data.banners);
          // 设置状态
          setBanners(transformBanners(data.banners));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load banners:', err);
        setIsLoading(false);
      });
  }, [transformBanners]);

  // 自动轮播
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  // 手动切换
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 下一张
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // 上一张
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // 滑动阈值

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向左滑动，下一张
        goToNext();
      } else {
        // 向右滑动，上一张
        goToPrev();
      }
    }
  }, [goToNext, goToPrev]);

  if (isLoading) {
    return (
      <div className="mx-4 h-44 rounded-2xl bg-gray-800/50 animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="px-4">
      <div
        className="relative overflow-hidden rounded-2xl h-44 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Banner 内容 */}
        <div className="absolute inset-0">
          {/* 背景图片 */}
          {currentBanner.image ? (
            <>
              <Image
                src={currentBanner.image}
                alt={currentBanner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={currentIndex === 0}
              />
              {/* 遮罩层，保证文字可读性 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <>
              {/* 无图片时的默认渐变 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
              <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
            </>
          )}
        </div>

        {/* 文字内容 */}
        <div className="relative z-10 flex flex-col justify-center h-full p-5">
          <h2 className="text-xl font-bold text-white mb-1">
            {currentBanner.title}
          </h2>
          <p className="text-sm text-gray-200 mb-4 max-w-[200px]">
            {currentBanner.subtitle}
          </p>
          {currentBanner.buttonText && currentBanner.buttonLink !== '#' && (
            <Link
              href={currentBanner.buttonLink}
              className="inline-flex items-center justify-center w-fit px-5 py-2.5 text-sm font-semibold text-purple-900 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              {currentBanner.buttonText}
            </Link>
          )}
        </div>

        {/* 指示点 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all ${index === currentIndex
                ? 'w-4 bg-white'
                : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
