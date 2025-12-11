'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Pause, Mic, Download, Sparkles, ChevronUp, Loader2, Globe, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';
import { AdBanner } from '@/components/ads';
import { LanguageExploreGrid, type LanguageCardItem } from '@/components/features/tts-promo';
import { getPromoVoices } from '@/actions/voice';
import { getLatestRelease, incrementDownloadCountByVersion } from '@/actions/admin/app-releases';
import { getVoiceSampleUrl } from '@/types/voice';
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

// Role filter options
const ROLE_OPTIONS = [
  { code: 'All', nameKey: 'ttsPromo.filters.all', icon: '🔥' },
  { code: 'Celebrity', nameKey: 'ttsPromo.filters.celebrities', icon: '⭐' },
  { code: 'Professional', nameKey: 'ttsPromo.filters.professional', icon: '🎙️' },
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('All');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // APK download state
  const [apkInfo, setApkInfo] = useState<{
    version: string;
    download_url: string;
  } | null>(null);

  // Device detection state
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');

  // Detect device type
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Load latest APK info
  useEffect(() => {
    async function loadApkInfo() {
      try {
        const release = await getLatestRelease('android');
        if (release) {
          setApkInfo({
            version: release.version,
            download_url: release.download_url,
          });
        }
      } catch (error) {
        console.error('Failed to load APK info:', error);
      }
    }
    loadApkInfo();
  }, []);

  // Handle APK download with tracking
  const handleApkDownload = async () => {
    if (!apkInfo) return;
    // Track download count
    await incrementDownloadCountByVersion('android', apkInfo.version);
    // Trigger download
    window.open(apkInfo.download_url, '_blank');
  };

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

    async function loadVoices() {
      setLoading(true);
      try {
        if (selectedRole === 'All') {
          // For "All" mode: fetch Celebrity first, then Professional
          const [celebrityVoices, professionalVoices] = await Promise.all([
            getPromoVoices(selectedLanguage, 'Celebrity', 20),
            getPromoVoices(selectedLanguage, 'Professional', 20),
          ]);

          // Combine: Celebrity first, then Professional, take 20 total
          const combinedVoices = [...celebrityVoices, ...professionalVoices].slice(0, 20);
          setVoices(combinedVoices);
        } else {
          // For specific role filter
          const voices = await getPromoVoices(selectedLanguage, selectedRole, 20);
          setVoices(voices);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVoices();
  }, [selectedLanguage, selectedRole]);

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

  // Handle voice sample play/pause
  const handlePlayVoice = (voice: Voice) => {
    if (playingId === voice.id) {
      // Pause current
      audioRef.current?.pause();
      setPlayingId(null);
      setLoadingId(null);
    } else if (loadingId === voice.id) {
      // Already loading, ignore click
      return;
    } else {
      // Stop previous and play new
      audioRef.current?.pause();
      setPlayingId(null);

      const sampleUrl = getVoiceSampleUrl(voice);
      if (sampleUrl) {
        setLoadingId(voice.id);
        const audio = new Audio(sampleUrl);

        audio.oncanplaythrough = () => {
          // Audio loaded, start playing
          setLoadingId(null);
          setPlayingId(voice.id);
          audio.play().catch(() => {
            setPlayingId(null);
            setLoadingId(null);
          });
        };

        audio.onended = () => {
          setPlayingId(null);
          setLoadingId(null);
        };

        audio.onerror = () => {
          setPlayingId(null);
          setLoadingId(null);
        };

        audio.load();
        audioRef.current = audio;
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setIsLanguageDropdownOpen(false);
    // Stop any playing audio when changing language
    audioRef.current?.pause();
    setPlayingId(null);
  };

  const handleRoleSelect = (code: string) => {
    setSelectedRole(code);
    // Stop any playing audio when changing role
    audioRef.current?.pause();
    setPlayingId(null);
  };

  const selectedLangOption = LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ========== Hero Section ========== */}
      <section className="relative pt-20 pb-4 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Free Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1.5">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">{t('ttsPromo.hero.badge')}</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              {t('ttsPromo.hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {t('ttsPromo.hero.titleHighlight1')}
              </span>
              <br />
              {t('ttsPromo.hero.title2')}
            </h1>

            {/* Subtitle with stats */}
            <p className="text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-3">
              {t('ttsPromo.hero.subtitle')}
            </p>

            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t('ttsPromo.hero.description')}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-6 md:gap-10 mb-6">
            {STATS_CONFIG.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl md:text-3xl font-bold ${stat.isFree ? 'text-green-400' : 'text-purple-400'}`}>
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-gray-400">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>

          {/* Download & Try Buttons */}
          {/* 桌面端显示3个按钮，移动端根据设备类型显示2个并排 */}
          <div className={`flex justify-center gap-3 ${deviceType === 'desktop' ? 'flex-wrap' : ''}`}>
            {/* Android APK - 仅在非 iOS 设备上显示 */}
            {deviceType !== 'ios' && (
              apkInfo ? (
                <button
                  onClick={handleApkDownload}
                  className={`flex items-center gap-3 bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{t('ttsPromo.hero.downloadApk')}</div>
                    <div className="text-sm font-semibold text-white">Android</div>
                  </div>
                </button>
              ) : (
                <div className={`flex items-center gap-3 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 opacity-50 cursor-not-allowed ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}>
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Android</div>
                    <div className="text-sm font-semibold text-gray-400">{t('ttsPromo.hero.comingSoon')}</div>
                  </div>
                </div>
              )
            )}

            {/* iOS - 仅在非 Android 设备上显示 */}
            {deviceType !== 'android' && (
              <div className={`flex items-center gap-3 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 opacity-50 cursor-not-allowed ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}>
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">iOS</div>
                  <div className="text-sm font-semibold text-gray-400">{t('ttsPromo.hero.comingSoon')}</div>
                </div>
              </div>
            )}

            {/* Web Version */}
            <button
              onClick={handleGetStarted}
              className={`flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-500/30 rounded-xl px-4 py-3 hover:from-purple-700 hover:to-pink-700 transition-colors ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}
            >
              <span className="text-2xl">🌐</span>
              <div className="text-left">
                <div className="text-[10px] text-purple-200 uppercase tracking-wide whitespace-nowrap">{t('ttsPromo.hero.tryNow')}</div>
                <div className="text-sm font-semibold text-white whitespace-nowrap">{t('ttsPromo.hero.webVersion')}</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 广告位 - Hero 底部 */}
      <AdBanner slot="TTS_HERO_BOTTOM" variant="section" className="bg-[#0a0a0f]" />

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

          {/* Language Selector + Role Filter Tabs (with border box) */}
          <div className="flex justify-center mb-4 px-2">
            <div className="flex items-center gap-0.5 md:gap-1 bg-gray-800/50 border border-gray-700 rounded-full px-1.5 md:px-2 py-1">
              {/* Language Selector */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center gap-1 md:gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full px-2 md:px-4 py-1.5 md:py-2 text-white transition-colors min-w-[90px] md:min-w-[140px] justify-between text-xs md:text-sm"
                >
                  <span className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs">{selectedLangOption.flag}</span>
                    <span className="truncate max-w-[50px] md:max-w-none">{selectedLangOption.name}</span>
                  </span>
                  <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 transition-transform ${isLanguageDropdownOpen ? '' : 'rotate-180'}`} />
                </button>

                {/* Dropdown Menu - Opens downward */}
                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
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

              {/* Role Filter Tabs */}
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.code}
                  onClick={() => handleRoleSelect(role.code)}
                  className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all rounded-full whitespace-nowrap ${
                    selectedRole === role.code
                      ? 'text-yellow-400 bg-gray-700/50'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                  }`}
                >
                  <span className={selectedRole === role.code ? '' : 'opacity-60'}>{role.icon}</span>
                  <span>{t(role.nameKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Grid */}
          {loading ? (
            <>
              {/* Mobile: 4 columns */}
              <div className="grid grid-cols-4 gap-3 md:hidden">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-full bg-gray-800 animate-pulse" />
                ))}
              </div>
              {/* Desktop: 10 + 10 layout */}
              <div className="hidden md:block">
                <div className="flex justify-center gap-4 mb-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full bg-gray-800 animate-pulse" />
                  ))}
                </div>
                <div className="flex justify-center gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full bg-gray-800 animate-pulse" />
                  ))}
                </div>
              </div>
            </>
          ) : voices.length > 0 ? (
            <>
              {/* Mobile: 4 columns grid */}
              <div className="grid grid-cols-4 gap-3 md:hidden">
                {voices.map((voice) => (
                  <div key={voice.id} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handlePlayVoice(voice)}
                      className="group relative aspect-square w-full rounded-full overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {voice.avatar_url ? (
                        <Image
                          src={voice.avatar_url}
                          alt={voice.display_name}
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
                      )}
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                        playingId === voice.id || loadingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {loadingId === voice.id ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : playingId === voice.id ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        )}
                      </div>
                      {playingId === voice.id && (
                        <div className="absolute inset-0 border-3 border-purple-500 rounded-full animate-pulse" />
                      )}
                    </button>
                    <span className="text-[10px] text-gray-400 text-center w-full truncate px-1">
                      {voice.display_name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop: First row 10, second row 10 */}
              <div className="hidden md:block">
                {/* First row: 10 voices */}
                <div className="flex justify-center gap-4 mb-6">
                  {voices.slice(0, 10).map((voice) => (
                    <div key={voice.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePlayVoice(voice)}
                        className="group relative w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {voice.avatar_url ? (
                          <Image
                            src={voice.avatar_url}
                            alt={voice.display_name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                          playingId === voice.id || loadingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {loadingId === voice.id ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : playingId === voice.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          )}
                        </div>
                        {playingId === voice.id && (
                          <div className="absolute inset-0 border-3 border-purple-500 rounded-full animate-pulse" />
                        )}
                      </button>
                      <span className="text-xs text-gray-400 text-center w-16 lg:w-20 truncate">
                        {voice.display_name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Second row: 10 voices */}
                <div className="flex justify-center gap-4">
                  {voices.slice(10, 20).map((voice) => (
                    <div key={voice.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePlayVoice(voice)}
                        className="group relative w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {voice.avatar_url ? (
                          <Image
                            src={voice.avatar_url}
                            alt={voice.display_name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                          playingId === voice.id || loadingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {loadingId === voice.id ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : playingId === voice.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          )}
                        </div>
                        {playingId === voice.id && (
                          <div className="absolute inset-0 border-3 border-purple-500 rounded-full animate-pulse" />
                        )}
                      </button>
                      <span className="text-xs text-gray-400 text-center w-16 lg:w-20 truncate">
                        {voice.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">{t('ttsPromo.samples.noVoices')}</p>
            </div>
          )}

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