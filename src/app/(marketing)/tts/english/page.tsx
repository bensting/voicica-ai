'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// English language TTS landing page - hardcoded content for SEO
// Free AI Text to Speech Generator - English

// English content
const CONTENT = {
  hero: {
    badge: '100% Free • No Sign-up Required',
    title1: 'Free AI',
    titleHighlight: 'Text to Speech',
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
  explore: {
    title: 'Explore AI Voices in Multiple Languages',
    subtitle: 'Our text-to-speech service supports 190+ languages and accents, allowing you to seamlessly transform text into natural-sounding speech.',
    exploreMore: 'Explore More',
  },
};

export default function EnglishTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'Voices' },
          { value: STATS_VALUES.languages, label: 'Languages' },
          { value: STATS_VALUES.free, label: 'FREE', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="en-US"
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
        currentLanguage="en-US"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}