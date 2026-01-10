'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  ALL_LANGUAGES,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Map UI locale to voice locale
const UI_TO_VOICE_LOCALE_MAP: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'en-US': 'en-US',
  'th-TH': 'th-TH',
};

// Map browser language to voice locale (best effort)
function getBrowserVoiceLocale(): string | null {
  if (typeof navigator === 'undefined') return null;

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage;
  if (!browserLang) return null;

  const langCode = browserLang.toLowerCase();

  // Check for Chinese variants
  if (langCode.startsWith('zh')) {
    if (langCode.includes('tw') || langCode.includes('hant') || langCode.includes('hk') || langCode.includes('mo')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  // Check for other supported languages
  if (langCode.startsWith('ja')) return 'ja-JP';
  if (langCode.startsWith('ko')) return 'ko-KR';
  if (langCode.startsWith('es')) return 'es-ES';
  if (langCode.startsWith('fr')) return 'fr-FR';
  if (langCode.startsWith('de')) return 'de-DE';
  if (langCode.startsWith('ar')) return 'ar-SA';
  if (langCode.startsWith('ru')) return 'ru-RU';
  if (langCode.startsWith('pt')) return 'pt-BR';
  if (langCode.startsWith('th')) return 'th-TH';
  if (langCode.startsWith('en')) return 'en-US';

  return null;
}

export default function TTSPromoPage() {
  const searchParams = useSearchParams();
  const { t, locale: uiLocale, setLocale } = useLanguage();
  const [defaultLanguage, setDefaultLanguage] = useState<string | null>(null);

  // Initialize language with priority: URL param > UI locale > browser language > English
  useEffect(() => {
    const langParam = searchParams.get('lang');

    // Priority 1: URL parameter
    if (langParam) {
      const validLang = ALL_LANGUAGES.find(l => l.code === langParam);
      if (validLang) {
        setDefaultLanguage(langParam);
        // Also set the page locale based on URL parameter
        const uiLocaleMap: Record<string, 'en-US' | 'zh-CN' | 'zh-TW' | 'th-TH'> = {
          'zh-CN': 'zh-CN',
          'zh-TW': 'zh-TW',
          'en-US': 'en-US',
          'ja-JP': 'en-US',
          'ko-KR': 'en-US',
          'es-ES': 'en-US',
          'fr-FR': 'en-US',
          'de-DE': 'en-US',
          'ar-SA': 'en-US',
          'ru-RU': 'en-US',
          'pt-BR': 'en-US',
          'th-TH': 'th-TH',
        };
        const newUiLocale = uiLocaleMap[langParam] || 'en-US';
        setLocale(newUiLocale);
        return;
      }
    }

    // Priority 2: Website UI locale (from LanguageContext)
    const uiVoiceLocale = UI_TO_VOICE_LOCALE_MAP[uiLocale];
    if (uiVoiceLocale && ALL_LANGUAGES.find(l => l.code === uiVoiceLocale)) {
      setDefaultLanguage(uiVoiceLocale);
      return;
    }

    // Priority 3: Browser language
    const browserLocale = getBrowserVoiceLocale();
    if (browserLocale && ALL_LANGUAGES.find(l => l.code === browserLocale)) {
      setDefaultLanguage(browserLocale);
      return;
    }

    // Priority 4: Default to English
    setDefaultLanguage('en-US');
  }, [searchParams, uiLocale, setLocale]);

  // Wait for language to be determined
  if (!defaultLanguage) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <TTSHeroSection
        badge={t('ttsPromo.hero.badge')}
        title1={t('ttsPromo.hero.title1')}
        titleHighlight={t('ttsPromo.hero.titleHighlight1')}
        title2={t('ttsPromo.hero.title2')}
        subtitle={t('ttsPromo.hero.subtitle')}
        description={t('ttsPromo.hero.description')}
        stats={[
          { value: STATS_VALUES.voices, label: t('ttsPromo.stats.voices') },
          { value: STATS_VALUES.languages, label: t('ttsPromo.stats.languages') },
          { value: STATS_VALUES.free, label: t('ttsPromo.stats.free'), isFree: true },
        ]}
        webVersionText={t('ttsPromo.hero.webVersion')}
        tryNowText={t('ttsPromo.hero.tryNow')}
      />

      <VoiceSamplesSection
        defaultLanguage={defaultLanguage}
        title1={t('ttsPromo.samples.title1')}
        title2={t('ttsPromo.samples.title2')}
        titleHighlight={t('ttsPromo.samples.titleHighlight')}
        description={t('ttsPromo.samples.description')}
        emptyText={t('ttsPromo.samples.noVoices')}
        exploreAllText={t('ttsPromo.samples.exploreAll') || 'Explore all AI Characters'}
      />

      <TTSCTASection
        feature1={t('ttsPromo.cta.feature1')}
        feature2={t('ttsPromo.cta.feature2')}
        feature3={t('ttsPromo.cta.feature3')}
        feature4={t('ttsPromo.cta.feature4')}
        startCreatingText={t('ttsPromo.cta.startCreating')}
        noCreditCardText={t('ttsPromo.cta.noCreditCard')}
        noSignupText={t('ttsPromo.cta.noSignup')}
      />

      <LanguageExploreGrid
        title={t('ttsPromo.explore.title') || 'Explore AI Voices in Multiple Languages'}
        subtitle={t('ttsPromo.explore.subtitle') || 'Our text-to-speech service supports 190+ languages. Select your preferred language and start creating content with high-quality AI voices.'}
        languages={EXPLORE_LANGUAGE_PAGES}
        exploreMoreText={t('ttsPromo.explore.exploreMore') || 'Explore More'}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}