'use client';

import { useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { AppDownloadButtons } from '@/components/features/app-download';

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
  tryNowText,
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
        <div className="flex justify-center gap-5 md:gap-8 mb-3">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-xl md:text-2xl font-bold ${stat.isFree ? 'text-green-400' : 'text-purple-400'}`}>
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Download Buttons */}
        <div className="flex justify-center">
          <div className="w-full max-w-xs bg-gray-900/60 backdrop-blur-sm rounded-xl p-2.5 border border-gray-800">
            <AppDownloadButtons variant="dark" showSectionHeaders={true} compact={true} />

            {/* Web Version 入口 */}
            <div className="mt-1.5 pt-1.5 border-t border-gray-700">
              {/* Web 区域标题 */}
              <div className="flex items-center gap-1 mb-1">
                <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center">
                  <Globe className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="font-semibold text-white text-xs">Web</span>
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full flex items-center gap-2 p-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white rounded-lg transition-colors border border-purple-500/30"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-xs">{webVersionText}</div>
                  <div className="text-[10px] text-gray-400">{tryNowText}</div>
                </div>
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}