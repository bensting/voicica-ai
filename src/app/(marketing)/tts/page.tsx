'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, Download, Sparkles, Check, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';
import { LanguageExploreGrid, TTSHeroSection, VoiceSelectorSection, ALL_LANGUAGES, type LanguageCardItem } from '@/components/features/tts-promo';

// Stats data - will be populated with translations
const STATS_CONFIG = [
  { value: '3200+', labelKey: 'ttsPromo.stats.voices', highlight: true },
  { value: '190+', labelKey: 'ttsPromo.stats.languages', highlight: true },
  { value: '100%', labelKey: 'ttsPromo.stats.free', highlight: true, isFree: true },
];

// Language explore grid - links to language-specific landing pages
const EXPLORE_LANGUAGES: LanguageCardItem[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸', href: '/tts/english' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭', href: '/tts/thai' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', href: '/tts/indonesian' },
];

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
  const router = useRouter();
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

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

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
      {/* ========== Hero Section ========== */}
      <TTSHeroSection
        badge={t('ttsPromo.hero.badge')}
        title1={t('ttsPromo.hero.title1')}
        titleHighlight={t('ttsPromo.hero.titleHighlight1')}
        title2={t('ttsPromo.hero.title2')}
        subtitle={t('ttsPromo.hero.subtitle')}
        description={t('ttsPromo.hero.description')}
        stats={STATS_CONFIG.map(stat => ({
          value: stat.value,
          label: t(stat.labelKey),
          isFree: stat.isFree,
        }))}
        webVersionText={t('ttsPromo.hero.webVersion')}
        tryNowText={t('ttsPromo.hero.tryNow')}
      />

      {/* ========== Voice Samples Section ========== */}
      <section className="pt-4 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header - Hidden on mobile */}
          <div className="hidden md:block text-center mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {t('ttsPromo.samples.title1')}<br />
              {t('ttsPromo.samples.title2')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {t('ttsPromo.samples.titleHighlight')}
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('ttsPromo.samples.description')}
            </p>
          </div>

          {/* Voice Selector Section */}
          <VoiceSelectorSection
            defaultLanguage={defaultLanguage}
            emptyText={t('ttsPromo.samples.noVoices')}
          />

          {/* Explore All Characters Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/studio/voices')}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              {t('ttsPromo.samples.exploreAll') || 'Explore all AI Characters'} →
            </button>
          </div>
        </div>
      </section>

      {/* ========== CTA Section ========== */}
      <section className="py-8 px-4 bg-gradient-to-t from-purple-900/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          {/* Features - 2x2 grid on mobile, inline on desktop */}
          <div className="grid grid-cols-2 md:flex md:justify-center gap-3 md:gap-6 mb-6">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{t('ttsPromo.cta.feature1')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Download className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{t('ttsPromo.cta.feature2')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Mic className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{t('ttsPromo.cta.feature3')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 font-medium">{t('ttsPromo.cta.feature4')}</span>
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
              {t('ttsPromo.cta.startCreating')}
            </GradientButton>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            {t('ttsPromo.cta.noCreditCard')} • {t('ttsPromo.cta.noSignup')}
          </p>
        </div>
      </section>

      {/* ========== Language Explore Section ========== */}
      <LanguageExploreGrid
        title={t('ttsPromo.explore.title') || 'Explore AI Voices in Multiple Languages'}
        subtitle={t('ttsPromo.explore.subtitle') || 'Our text-to-speech service supports 190+ languages. Select your preferred language and start creating content with high-quality AI voices.'}
        languages={EXPLORE_LANGUAGES}
        exploreMoreText={t('ttsPromo.explore.exploreMore') || 'Explore More'}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}