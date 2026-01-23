'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  gradient: string;
}

/**
 * Banner 轮播组件
 * 从静态 JSON 加载数据，支持自动轮播和手动滑动切换
 */
export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 触摸滑动相关
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  // 加载 Banner 数据
  useEffect(() => {
    fetch('/data/native-banners.json')
      .then((res) => res.json())
      .then((data) => {
        setBanners(data.banners || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load banners:', err);
        setIsLoading(false);
      });
  }, []);

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
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient}`}
        >
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
              {/* 纯色渐变时的装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50" />
              <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
            </>
          )}
        </div>

        {/* 文字内容 */}
        <div className="relative z-10 flex flex-col justify-center h-full p-5">
          <h2 className="text-xl font-bold text-white mb-1">
            {currentBanner.title}
            <span className="ml-1 text-yellow-300">✦</span>
          </h2>
          <p className="text-sm text-gray-200 mb-4 max-w-[200px]">
            {currentBanner.subtitle}
          </p>
          <Link
            href={currentBanner.buttonLink}
            className="inline-flex items-center justify-center w-fit px-5 py-2.5 text-sm font-semibold text-purple-900 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            {currentBanner.buttonText}
          </Link>
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
