'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Indonesian language TTS landing page - hardcoded content for SEO
// Text to Speech AI Gratis Bahasa Indonesia

// Indonesian content
const CONTENT = {
  hero: {
    badge: '100% Gratis • Tanpa Daftar',
    title1: 'AI',
    titleHighlight: 'Text to Speech',
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
  explore: {
    title: 'Jelajahi Suara AI dalam Berbagai Bahasa',
    subtitle: 'Layanan text-to-speech kami mendukung lebih dari 190 bahasa. Pilih bahasa yang Anda butuhkan dan mulai membuat konten dengan suara AI berkualitas tinggi.',
    exploreMore: 'Jelajahi Lebih Lanjut',
  },
};

export default function IndonesianTTSPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <TTSHeroSection
        badge={CONTENT.hero.badge}
        title1={CONTENT.hero.title1}
        titleHighlight={CONTENT.hero.titleHighlight}
        title2={CONTENT.hero.title2}
        subtitle={CONTENT.hero.subtitle}
        description={CONTENT.hero.description}
        stats={[
          { value: STATS_VALUES.voices, label: 'Suara' },
          { value: STATS_VALUES.languages, label: 'Bahasa' },
          { value: STATS_VALUES.free, label: 'Gratis', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="id-ID"
        title1={CONTENT.samples.title1}
        title2={CONTENT.samples.title2}
        titleHighlight={CONTENT.samples.titleHighlight}
        description={CONTENT.samples.description}
        emptyText={CONTENT.samples.noVoices}
        exploreAllText={CONTENT.samples.exploreAll}
      />

      <TTSCTASection
        feature1={CONTENT.cta.feature1}
        feature2={CONTENT.cta.feature2}
        feature3={CONTENT.cta.feature3}
        feature4={CONTENT.cta.feature4}
        startCreatingText={CONTENT.cta.startCreating}
        noCreditCardText={CONTENT.cta.noCreditCard}
        noSignupText={CONTENT.cta.noSignup}
      />

      <LanguageExploreGrid
        title={CONTENT.explore.title}
        subtitle={CONTENT.explore.subtitle}
        languages={EXPLORE_LANGUAGE_PAGES}
        currentLanguage="id-ID"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}