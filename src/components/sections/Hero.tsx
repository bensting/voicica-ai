'use client';

import { useRouter } from 'next/navigation';
import { Music, Mic, Sparkles, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AppDownloadButtons from '@/components/common/AppDownloadButtons';

// 魔法棒图标
const WandIcon = () => (
  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
  </svg>
);

/**
 * Hero Section - Marketing 首页主视觉区域
 */
export default function Hero() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-16 md:py-20">
        {/* Brand Name */}
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 tracking-tight">
            Voicica.AI
          </h2>
        </div>

        {/* 100% Free Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full shadow-lg shadow-pink-200/50">
            <span className="text-white font-semibold text-sm">
              {t('home.heroFreeTag') || '100% Free'}
            </span>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-4 max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-3xl sm:text-4xl md:text-5xl leading-tight">
            {t('home.heroTitlePrefix')}{' '}
            {t('home.heroTitleHighlight')}
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm md:text-base text-center max-w-xs mx-auto mb-4">
          {t('home.heroDescription')}
        </p>

        {/* Trust Indicator */}
        <p className="text-center text-sm text-gray-400 mb-8 max-w-[200px] mx-auto">
          {t('home.trustedByCreators') || 'Trusted by 1,000,000+ Creators'}
        </p>

        {/* Feature Cards */}
        <FeatureCards />

        {/* App Download Section */}
        <AppDownloadButtons variant="light" layout="horizontal" className="mt-8" />
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/**
 * Hero 背景渐变
 */
function HeroBackground() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50 via-white to-white" />
      {/* Left pink gradient */}
      <div className="absolute top-0 left-0 w-[500px] h-full bg-gradient-to-r from-pink-200/60 to-transparent" />
      {/* Right purple gradient */}
      <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-purple-200/50 to-transparent" />
      {/* Top center glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-pink-100/40 to-transparent rounded-full blur-3xl" />
    </div>
  );
}

/**
 * 功能卡片区域
 */
function FeatureCards() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="space-y-4 mb-8">
      {/* Main Card - AI Song One-Click */}
      <button
        onClick={() => router.push('/studio/ai-song')}
        className="w-full group"
      >
        {/* White outer + Pink inner border */}
        <div className="rounded-full p-[2px] bg-white shadow-lg shadow-pink-100/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="rounded-full p-[2px] bg-gradient-to-r from-pink-200 to-pink-300">
            <div className="bg-white rounded-full px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Pink square icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                  <WandIcon />
                </div>
                {/* Title */}
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  {t('home.aiSongOneClick')}
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </h3>
              </div>
              {/* Play Sample */}
              <span className="inline-flex items-center gap-1.5 text-sm text-pink-500 group-hover:text-pink-600 transition-colors">
                <Play className="w-4 h-4" />
                {t('home.playSample') || 'Play Sample'}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Two Small Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Text to Speech */}
        <FeatureCardSmall
          icon={<Mic className="w-6 h-6 text-blue-400" />}
          title={t('home.textToSpeech')}
          href="/studio/tts"
        />

        {/* Lyrics to Music */}
        <FeatureCardSmall
          icon={<Music className="w-6 h-6 text-pink-400" />}
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
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => router.push(href)}
      className="group"
    >
      <div className="rounded-3xl p-[2px] bg-white shadow-md shadow-pink-50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <div className="rounded-3xl p-[2px] bg-gradient-to-r from-pink-100 to-pink-200">
          <div className="bg-white rounded-3xl p-4 flex flex-col items-center text-center gap-2">
            {icon}
            <span className="text-sm font-bold text-gray-800">
              {title}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-pink-500 transition-colors">
              <Play className="w-3 h-3" />
              {t('home.playSample') || 'Play Sample'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
