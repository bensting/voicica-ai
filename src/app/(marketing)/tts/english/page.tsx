'use client';

import { useRouter } from 'next/navigation';
import { Mic, Download, Sparkles, Globe, Check } from 'lucide-react';
import { GradientButton } from '@/components/ui';
import {
  VoiceSelectorSection,
  LanguageExploreGrid,
  TTSHeroSection,
  type LanguageCardItem,
} from '@/components/features/tts-promo';

// English language TTS landing page - hardcoded content for SEO
// Free AI Text to Speech Generator - English

// Stats data - English
const STATS_CONFIG = [
  { value: '3200+', label: 'Voices', highlight: true },
  { value: '190+', label: 'Languages', highlight: true },
  { value: '100%', label: 'FREE', highlight: true, isFree: true },
];

// Language explore grid - links to other language pages
const EXPLORE_LANGUAGES: LanguageCardItem[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸', href: '/tts/english' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭', href: '/tts/thai' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', href: '/tts/indonesian' },
];

// English content
const CONTENT = {
  hero: {
    badge: '100% Free • No Sign-up Required',
    title1: 'Free AI',
    titleHighlight1: 'Text to Speech',
    title2: 'Generator',
    subtitle: '3200+ Voices • 190+ Languages',
    description: 'Transform text into natural speech instantly. Celebrity voices, professional narrators, or clone your own voice.',
    webVersion: 'Web Version',
    tryNow: 'Start Free',
  },
  samples: {
    title1: 'Listen to real',
    title2: 'examples of our',
    titleHighlight: 'AI Voices',
    description: 'Hyper-realistic voice cloning with emotions, tone, and natural pronunciation.',
    noVoices: 'No voices available for this language.',
    exploreAll: 'Explore all 3200+ Voices',
  },
  cta: {
    feature1: '3200+ AI Voices in 190+ Languages',
    feature2: 'Download MP3/WAV - Unlimited',
    feature3: 'Clone Your Own Voice',
    feature4: '100% Free Forever',
    startCreating: 'Start Creating - It\'s Free',
    noCreditCard: 'No credit card',
    noSignup: 'No sign-up required',
  },
};

export default function EnglishTTSPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ========== Hero Section ========== */}
      <TTSHeroSection
        badge={CONTENT.hero.badge}
        title1={CONTENT.hero.title1}
        titleHighlight={CONTENT.hero.titleHighlight1}
        title2={CONTENT.hero.title2}
        subtitle={CONTENT.hero.subtitle}
        description={CONTENT.hero.description}
        stats={STATS_CONFIG}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      {/* ========== Voice Samples Section ========== */}
      <section className="pt-4 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="hidden md:block text-center mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {CONTENT.samples.title1}<br />
              {CONTENT.samples.title2}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {CONTENT.samples.titleHighlight}
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {CONTENT.samples.description}
            </p>
          </div>

          {/* Voice Selector Section */}
          <VoiceSelectorSection
            defaultLanguage="en-US"
            emptyText={CONTENT.samples.noVoices}
          />

          {/* Explore All Characters Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/studio/voices')}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              {CONTENT.samples.exploreAll} →
            </button>
          </div>
        </div>
      </section>

      {/* ========== CTA Section ========== */}
      <section className="py-8 px-4 bg-gradient-to-t from-purple-900/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          {/* Features */}
          <div className="grid grid-cols-2 md:flex md:justify-center gap-3 md:gap-6 mb-6">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{CONTENT.cta.feature1}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Download className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{CONTENT.cta.feature2}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Mic className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{CONTENT.cta.feature3}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 font-medium">{CONTENT.cta.feature4}</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <GradientButton
              size="lg"
              className="min-w-[280px] py-5 text-lg"
              onClick={handleGetStarted}
            >
              <Sparkles className="w-6 h-6 mr-2" />
              {CONTENT.cta.startCreating}
            </GradientButton>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            {CONTENT.cta.noCreditCard} • {CONTENT.cta.noSignup}
          </p>
        </div>
      </section>

      {/* ========== Language Explore Section ========== */}
      <LanguageExploreGrid
        title="Explore AI Voices in Multiple Languages"
        subtitle="Our text-to-speech service supports 190+ languages and accents, allowing you to seamlessly transform text into natural-sounding speech."
        languages={EXPLORE_LANGUAGES}
        currentLanguage="en-US"
        exploreMoreText="Explore More"
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}