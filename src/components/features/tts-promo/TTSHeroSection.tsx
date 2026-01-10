'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface TTSHeroSectionProps {
  /** 顶部徽章文字 */
  badge: string;
  /** 主标题第一部分 */
  title1: string;
  /** 高亮文字 */
  titleHighlight: string;
  /** 主标题第二部分 */
  title2: string;
  /** 副标题 */
  subtitle: string;
  /** 描述文字 */
  description: string;
  /** 统计数据 */
  stats: Array<{
    value: string;
    label: string;
    isFree?: boolean;
  }>;
  /** Web 版本按钮文字 */
  webVersionText: string;
  /** 立即尝试文字 */
  tryNowText: string;
}

// Google Play 商店链接
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';

/**
 * TTS 落地页 Hero 区域组件
 * 包含徽章、标题、统计数据和下载按钮
 */
export default function TTSHeroSection({
  badge,
  title1,
  titleHighlight,
  title2,
  subtitle,
  description,
  stats,
  webVersionText,
}: TTSHeroSectionProps) {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  return (
    <section className="relative pt-16 pb-2 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-16 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Free Badge */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-medium">{badge}</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1.5 leading-tight">
            {title1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {titleHighlight}
            </span>
            <br />
            {title2}
          </h1>

          {/* Subtitle with stats */}
          <p className="text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-1.5">
            {subtitle}
          </p>

          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-5 md:gap-8 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-xl md:text-2xl font-bold ${stat.isFree ? 'text-green-400' : 'text-purple-400'}`}>
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* App Store Badges */}
        <div className="flex flex-col items-center gap-3">
          {/* Store Badges Row */}
          <div className="flex items-start justify-center gap-4">
            {/* Google Play Badge - Active (Left) */}
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="/images/stores/google-play-badge.svg"
                alt="Get it on Google Play"
                width={162}
                height={48}
                className="h-12 w-auto"
              />
            </a>

            {/* App Store Badge - Coming Soon (Right, Grayed out) */}
            <div className="flex flex-col items-center gap-1">
              <div className="opacity-40 grayscale pointer-events-none">
                <Image
                  src="/images/stores/app-store-badge.svg"
                  alt="Download on App Store"
                  width={144}
                  height={48}
                  className="h-12 w-auto"
                />
              </div>
              <span className="text-gray-500 text-[10px]">Coming Soon</span>
            </div>
          </div>

          {/* Web Version Link */}
          <button
            onClick={handleGetStarted}
            className="text-gray-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-1"
          >
            {webVersionText} →
          </button>
        </div>
      </div>
    </section>
  );
}