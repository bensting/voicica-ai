'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, Download, Sparkles, ChevronUp, Check, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';
import { LanguageExploreGrid, TTSHeroSection, VoiceSampleGrid, type LanguageCardItem } from '@/components/features/tts-promo';
import { getPromoVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';

// Language options with flag emojis
const LANGUAGE_OPTIONS = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nb-NO', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'sk-SK', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'ga-IE', name: 'Irish', flag: '🇮🇪' },
  { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
];

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

  // Exact match first
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
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize language with priority: URL param > UI locale > browser language > English
  useEffect(() => {
    const langParam = searchParams.get('lang');

    // Priority 1: URL parameter
    if (langParam) {
      const validLang = LANGUAGE_OPTIONS.find(l => l.code === langParam);
      if (validLang) {
        setSelectedLanguage(langParam);
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
    if (uiVoiceLocale && LANGUAGE_OPTIONS.find(l => l.code === uiVoiceLocale)) {
      setSelectedLanguage(uiVoiceLocale);
      return;
    }

    // Priority 3: Browser language
    const browserLocale = getBrowserVoiceLocale();
    if (browserLocale && LANGUAGE_OPTIONS.find(l => l.code === browserLocale)) {
      setSelectedLanguage(browserLocale);
      return;
    }

    // Priority 4: Default to English
    setSelectedLanguage('en-US');
  }, [searchParams, uiLocale, setLocale]);

  // Load voices from database (using cached getPromoVoices)
  useEffect(() => {
    if (!selectedLanguage) return; // Wait for language to be initialized

    const locale = selectedLanguage; // Capture for TypeScript narrowing

    async function loadVoices() {
      setLoading(true);
      try {
        // Fetch both Celebrity and Professional voices
        const [celebrityVoices, professionalVoices] = await Promise.all([
          getPromoVoices(locale, 'Celebrity', 20),
          getPromoVoices(locale, 'Professional', 20),
        ]);

        // Combine: Celebrity first, then Professional, take 20 total
        const combinedVoices = [...celebrityVoices, ...professionalVoices].slice(0, 20);
        setVoices(combinedVoices);
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVoices();
  }, [selectedLanguage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setIsLanguageDropdownOpen(false);
  };

  const selectedLangOption = LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

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

          {/* Language Selector */}
          <div className="flex justify-center mb-4 px-2">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white transition-colors min-w-[140px] justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span>{selectedLangOption.flag}</span>
                  <span>{selectedLangOption.name}</span>
                </span>
                <ChevronUp className={`w-4 h-4 flex-shrink-0 transition-transform ${isLanguageDropdownOpen ? '' : 'rotate-180'}`} />
              </button>

              {/* Dropdown Menu - Opens downward */}
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                        selectedLanguage === lang.code ? 'text-purple-400 bg-gray-800' : 'text-gray-300'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Voice Grid */}
          <VoiceSampleGrid
            voices={voices}
            loading={loading}
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