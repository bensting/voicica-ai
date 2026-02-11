'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Arabic language TTS landing page - hardcoded content for SEO
// أداة تحويل النص إلى كلام بالذكاء الاصطناعي مجاناً - عربي

// Arabic content
const CONTENT = {
  hero: {
    badge: 'مجاني 100% • بدون تسجيل',
    title1: 'AI',
    titleHighlight: 'تحويل النص إلى كلام',
    title2: 'مجاناً',
    subtitle: 'أكثر من 3200 صوت • أكثر من 190 لغة',
    description: 'حوّل النص إلى كلام طبيعي فوراً. أصوات المشاهير، تعليق صوتي احترافي، أو استنسخ صوتك الخاص.',
    webVersion: 'نسخة الويب',
    tryNow: 'ابدأ مجاناً',
  },
  samples: {
    title1: 'استمع إلى عينات',
    title2: 'من',
    titleHighlight: 'أصوات AI حقيقية',
    description: 'استنساخ صوتي واقعي مع المشاعر والنبرة والنطق الطبيعي.',
    noVoices: 'لا توجد أصوات لهذه اللغة',
    exploreAll: 'استكشف جميع الأصوات +3200',
  },
  cta: {
    feature1: 'أكثر من 3200 صوت AI في أكثر من 190 لغة',
    feature2: 'تحميل MP3/WAV غير محدود',
    feature3: 'استنسخ صوتك الخاص',
    feature4: 'مجاني 100% للأبد',
    startCreating: 'ابدأ الإنشاء مجاناً',
    noCreditCard: 'لا حاجة لبطاقة ائتمان',
    noSignup: 'لا حاجة للتسجيل',
  },
  explore: {
    title: 'استكشف أصوات AI بلغات متعددة',
    subtitle: 'تدعم خدمة تحويل النص إلى كلام أكثر من 190 لغة. اختر لغتك المفضلة وابدأ بإنشاء محتوى بأصوات AI عالية الجودة.',
    exploreMore: 'استكشف المزيد',
  },
};

export default function ArabicTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'صوت' },
          { value: STATS_VALUES.languages, label: 'لغة' },
          { value: STATS_VALUES.free, label: 'مجاني', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="ar-SA"
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
        currentLanguage="ar-SA"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/native/create/voice"
      />
    </div>
  );
}
