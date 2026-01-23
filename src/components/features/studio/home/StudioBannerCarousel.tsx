'use client';

import { useState, useEffect, useCallback } from 'react';
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
 * Studio Banner 轮播组件
 * 从静态 JSON 加载数据，支持自动轮播和手动切换
 */
export default function StudioBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 加载 Banner 数据
  useEffect(() => {
    fetch('/data/studio-banners.json')
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

  if (isLoading) {
    return (
      <div className="h-48 lg:h-56 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl h-48 lg:h-56">
      {/* Banner 内容 */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient || 'from-pink-500 to-rose-500'}`}
      >
        {/* 背景图片 */}
        {currentBanner.image ? (
          <>
            <Image
              src={currentBanner.image}
              alt={currentBanner.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority={currentIndex === 0}
            />
            {/* 遮罩层，保证文字可读性 */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-900/70 via-rose-800/50 to-transparent" />
          </>
        ) : (
          <>
            {/* 纯色渐变时的装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-rose-600/30" />
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-16 w-40 h-40 bg-rose-400/20 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* 文字内容 */}
      <div className="relative z-10 flex flex-col justify-center h-full p-6 lg:p-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          {currentBanner.title}
          <span className="ml-2 text-yellow-300">✦</span>
        </h2>
        <p className="text-sm lg:text-base text-white/90 mb-5 max-w-md">
          {currentBanner.subtitle}
        </p>
        <Link
          href={currentBanner.buttonLink}
          className="inline-flex items-center justify-center w-fit px-6 py-2.5 text-sm font-semibold text-pink-700 bg-white rounded-full hover:bg-pink-50 transition-colors shadow-lg"
        >
          {currentBanner.buttonText}
        </Link>
      </div>

      {/* 指示点 */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
