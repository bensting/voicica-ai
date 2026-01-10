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

// Indonesian language TTS landing page - hardcoded content for SEO
// Text to Speech AI Gratis Bahasa Indonesia

// Stats data - Indonesian
const STATS_CONFIG = [
  { value: '3200+', label: 'Suara', highlight: true },
  { value: '190+', label: 'Bahasa', highlight: true },
  { value: '100%', label: 'Gratis', highlight: true, isFree: true },
];

// Language explore grid - links to other language pages
const EXPLORE_LANGUAGES: LanguageCardItem[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸', href: '/tts/english' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭', href: '/tts/thai' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', href: '/tts/indonesian' },
];

// Indonesian content translations
const CONTENT = {
  hero: {
    badge: '100% Gratis • Tanpa Daftar',
    title1: 'AI',
    titleHighlight1: 'Text to Speech',
    title2: 'Gratis',
    subtitle: '3200+ Suara • 190+ Bahasa',
    description: 'Ubah teks menjadi suara alami secara instan. Suara selebriti, narator profesional, atau kloning suara Anda sendiri.',
    webVersion: 'Versi Web',
    tryNow: 'Mulai Gratis',
  },
  samples: {
    title1: 'Dengarkan contoh',
    title2: 'nyata dari',
    titleHighlight: 'Suara AI',
    description: 'Kloning suara ultra-realistis dengan emosi, nada, dan pengucapan alami.',
    noVoices: 'Tidak ada suara tersedia untuk bahasa ini.',
    exploreAll: 'Jelajahi semua 3200+ Suara',
  },
  cta: {
    feature1: '3200+ Suara AI dalam 190+ Bahasa',
    feature2: 'Unduh MP3/WAV Tanpa Batas',
    feature3: 'Kloning Suara Anda Sendiri',
    feature4: '100% Gratis Selamanya',
    startCreating: 'Mulai Membuat - Gratis',
    noCreditCard: 'Tanpa kartu kredit',
    noSignup: 'Tanpa perlu daftar',
  },
};

export default function IndonesianTTSPage() {
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
            defaultLanguage="id-ID"
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
        title="Jelajahi Suara AI dalam Berbagai Bahasa"
        subtitle="Layanan text-to-speech kami mendukung lebih dari 190 bahasa. Pilih bahasa yang Anda butuhkan dan mulai membuat konten dengan suara AI berkualitas tinggi."
        languages={EXPLORE_LANGUAGES}
        currentLanguage="id-ID"
        exploreMoreText="Jelajahi Lebih Lanjut"
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}