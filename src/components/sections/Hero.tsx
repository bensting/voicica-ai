'use client';

import { Music, Mic, Sparkles, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AppDownloadButtons from '@/components/common/AppDownloadButtons';

// 魔法棒图标
const WandIcon = () => (
  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
  </svg>
);

/**
 * Hero Section - Marketing 首页主视觉区域
 * Mobile: 一屏显示完成
 * Desktop: min-h-screen
 */
export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative h-[100dvh] lg:min-h-screen lg:h-auto flex flex-col lg:justify-center overflow-hidden">
      {/* Background */}
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4 sm:pt-24 sm:pb-8 lg:pt-24 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Brand Name */}
            <div className="mb-2 sm:mb-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic text-[#ff8da1] tracking-wide drop-shadow-sm font-sans">
                Voicica.AI
              </h2>
            </div>

            {/* 100% Free Badge */}
            <div className="mb-3 sm:mb-6">
              <div className="inline-flex items-center px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ff8da1] rounded-full shadow-lg shadow-pink-300/50">
                <span className="text-white font-bold text-sm sm:text-base tracking-wide">
                  {t('home.heroFreeTag') || '100% Free'}
                </span>
              </div>
            </div>

            {/* Main Title */}
            <div className="mb-2 sm:mb-4 max-w-2xl">
              <h1 className="font-extrabold text-gray-900 text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                {t('home.heroTitlePrefix')}{' '}
                {t('home.heroTitleHighlight')}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-gray-500 text-sm sm:text-base md:text-lg max-w-lg mb-2 sm:mb-4 leading-relaxed">
              {t('home.heroDescription')}
            </p>

            {/* Trust Indicator */}
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 font-medium">
              {t('home.trustedByCreators') || 'Trusted by 1,000,000+ Creators'}
            </p>

            {/* App Download Buttons (Desktop location) */}
            <div className="hidden lg:block">
              <AppDownloadButtons variant="light" layout="horizontal" className="grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100" />
            </div>
          </div>

          {/* Right Column: Feature Cards */}
          <div className="w-full max-w-md mx-auto lg:mr-0">
            {/* Feature Cards */}
            <FeatureCards />

            {/* App Download Buttons (Mobile location) */}
            <div className="lg:hidden flex justify-center">
              <AppDownloadButtons variant="light" layout="horizontal" className="grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

/**
 * Hero 背景渐变
 */
function HeroBackground() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#fff0f5]">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-100/50 via-white/80 to-white" />

      {/* Left pink orb */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-pink-200/40 rounded-full blur-[80px] sm:blur-[100px] mix-blend-multiply" />

      {/* Right purple orb */}
      <div className="absolute top-[10%] right-[-20%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-200/40 rounded-full blur-[80px] sm:blur-[100px] mix-blend-multiply" />

      {/* Center highlight */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

/**
 * 功能卡片区域
 */
function FeatureCards() {
  const { t } = useLanguage();

  return (
    <div className="space-y-3 sm:space-y-5 mb-4 sm:mb-8">
      {/* Main Card - AI Song One-Click */}
      <button
        onClick={() => window.open('/studio/ai-song', '_blank')}
        className="w-full group relative z-10"
      >
        <div className="relative rounded-2xl sm:rounded-[2rem] p-[2px] sm:p-[3px] bg-gradient-to-r from-pink-300 via-pink-200 to-pink-300 shadow-xl shadow-pink-200/40 hover:shadow-2xl hover:shadow-pink-300/50 hover:-translate-y-1 transition-all duration-300">
          <div className="bg-white rounded-[14px] sm:rounded-[1.8rem] px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon Circle */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#ff8da1] to-[#ff5c7c] rounded-full flex items-center justify-center shadow-lg shadow-pink-200">
                <WandIcon />
              </div>
              {/* Title */}
              <div className="flex flex-col items-start">
                <h3 className="font-bold text-gray-800 text-sm sm:text-lg flex items-center gap-2">
                  {t('home.aiSongOneClick')}
                </h3>
                <div className="flex items-center text-pink-400 gap-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Magic Create</span>
                </div>
              </div>
            </div>
            {/* Play Sample Button */}
            <div className="bg-pink-50 pl-2 pr-3 sm:pl-3 sm:pr-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 group-hover:bg-pink-100 transition-colors">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-500 ml-0.5" fill="currentColor" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-pink-500">
                {t('home.playSample') || 'Sample'}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Two Small Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Text to Speech */}
        <FeatureCardSmall
          icon={<Mic className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8da1]" />}
          title={t('home.textToSpeech')}
          href="/studio/tts"
        />

        {/* Lyrics to Music */}
        <FeatureCardSmall
          icon={<Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8da1]" />}
          title={t('home.lyricsToMusic')}
          href="/studio/ai-music"
        />
      </div>
    </div>
  );
}

/**
 * 小功能卡片
 */
interface FeatureCardSmallProps {
  icon: React.ReactNode;
  title: string;
  href: string;
}

function FeatureCardSmall({ icon, title, href }: FeatureCardSmallProps) {
  return (
    <button
      onClick={() => window.open(href, '_blank')}
      className="group relative h-full"
    >
      <div className="h-full rounded-xl sm:rounded-[2rem] p-[2px] bg-white border border-pink-100 sm:border-2 hover:border-pink-300 shadow-lg shadow-pink-50 hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1 transition-all duration-300">
        <div className="h-full bg-white rounded-[10px] sm:rounded-[1.8rem] p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-pink-50 rounded-xl sm:rounded-2xl group-hover:bg-pink-100 transition-colors">
            {icon}
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-gray-900">
            {title}
          </span>
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gray-50 group-hover:bg-pink-50 transition-colors">
            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400" fill="currentColor" />
            <span className="text-[9px] sm:text-[10px] font-medium text-gray-400 group-hover:text-pink-500">
              Sample
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
