'use client';

import { useRouter } from 'next/navigation';
import { Music, Mic, Sparkles, Play } from 'lucide-react';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import { useLanguage } from '@/contexts/LanguageContext';
import AppDownloadButtons from '@/components/common/AppDownloadButtons';

// 魔法棒图标
const WandIcon = () => (
  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background - Pink/Purple Gradient */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-50 via-white to-white" />
          {/* Left pink gradient */}
          <div className="absolute top-0 left-0 w-[500px] h-full bg-gradient-to-r from-pink-200/60 to-transparent" />
          {/* Right purple gradient */}
          <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-purple-200/50 to-transparent" />
          {/* Top center glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-pink-100/40 to-transparent rounded-full blur-3xl" />
        </div>

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
            <div className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-200/50">
              <span className="text-white font-bold text-sm">
                {t('home.heroFreeTag') || '100% Free'}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center mb-4">
            <h1 className="font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl leading-tight">
              {t('home.heroTitlePrefix')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500">
                {t('home.heroTitleHighlight')}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm md:text-base text-center max-w-md mx-auto mb-4">
            {t('home.heroDescription')}
          </p>

          {/* Trust Indicator */}
          <p className="text-center text-xs text-gray-400 mb-8">
            {t('home.trustedByCreators') || 'Trusted by 1,000,000+ Creators'}
          </p>

          {/* Feature Cards */}
          <div className="space-y-4 mb-8">
            {/* Main Card - AI Song One-Click */}
            <button
              onClick={() => router.push('/studio/ai-song')}
              className="w-full group"
            >
              <div className="relative bg-white/70 backdrop-blur-xl rounded-[28px] p-5 shadow-lg shadow-pink-100/50 border border-white/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/50">
                    <WandIcon />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      {t('home.aiSongOneClick')}
                      <Sparkles className="w-4 h-4 text-pink-400" />
                    </h3>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-pink-50 text-pink-500 px-3 py-1.5 rounded-full border border-pink-100 group-hover:bg-pink-100 transition-colors">
                    <Play className="w-3 h-3" />
                    {t('home.playSample') || 'Play Sample'}
                  </span>
                </div>
              </div>
            </button>

            {/* Two Small Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Text to Speech */}
              <button
                onClick={() => router.push('/studio/tts')}
                className="group"
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-4 shadow-md shadow-gray-100/50 border border-white/60 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {t('home.textToSpeech')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors">
                      <Play className="w-2.5 h-2.5" />
                      {t('home.playSample') || 'Play Sample'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Lyrics to Music */}
              <button
                onClick={() => router.push('/studio/ai-music')}
                className="group"
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-4 shadow-md shadow-gray-100/50 border border-white/60 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {t('home.lyricsToMusic')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-purple-500 transition-colors">
                      <Play className="w-2.5 h-2.5" />
                      {t('home.playSample') || 'Play Sample'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* App Download Section */}
          <AppDownloadButtons variant="light" layout="horizontal" className="mt-8" />
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}
