'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Pause, Mic, Star, Download, Sparkles, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';
import { listVoices } from '@/actions/voice';
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

// Stats data
const STATS = [
  { icon: '🏆', value: '1M+', label: 'Downloads' },
  { icon: '⭐', value: '100k+', label: 'Reviews', stars: 5 },
];

export default function TTSPromoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, setLocale } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
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

  // Initialize language from URL parameter
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam) {
      // Check if the language is valid
      const validLang = LANGUAGE_OPTIONS.find(l => l.code === langParam);
      if (validLang) {
        setSelectedLanguage(langParam);
        // Also set the page locale based on URL parameter
        // Map voice locale to UI locale (e.g., zh-CN -> zh-CN, zh-TW -> zh-TW)
        const uiLocaleMap: Record<string, 'en-US' | 'zh-CN' | 'zh-TW' | 'th-TH'> = {
          'zh-CN': 'zh-CN',
          'zh-TW': 'zh-TW',
          'en-US': 'en-US',
          'ja-JP': 'en-US', // fallback to English for unsupported UI locales
          'ko-KR': 'en-US',
          'es-ES': 'en-US',
          'fr-FR': 'en-US',
          'de-DE': 'en-US',
          'ar-SA': 'en-US',
          'ru-RU': 'en-US',
          'pt-BR': 'en-US',
          'th-TH': 'th-TH',
        };
        const uiLocale = uiLocaleMap[langParam] || 'en-US';
        setLocale(uiLocale);
      } else {
        setSelectedLanguage('en-US');
      }
    } else {
      setSelectedLanguage('en-US');
    }
  }, [searchParams, setLocale]);

  // Load voices from database
  useEffect(() => {
    if (!selectedLanguage) return; // Wait for language to be initialized

    async function loadVoices() {
      setLoading(true);
      try {
        if (selectedRole === 'All') {
          // For "All" mode: fetch Celebrity first, then Professional
          const [celebrityResponse, professionalResponse] = await Promise.all([
            listVoices({
              locale: selectedLanguage ?? undefined,
              role: 'Celebrity',
              is_active: true,
              page: 1,
              page_size: 22,
            }),
            listVoices({
              locale: selectedLanguage ?? undefined,
              role: 'Professional',
              is_active: true,
              page: 1,
              page_size: 22,
            }),
          ]);

          // Sort each by sort_order descending
          const sortedCelebrity = celebrityResponse.voices.sort((a, b) => b.sort_order - a.sort_order);
          const sortedProfessional = professionalResponse.voices.sort((a, b) => b.sort_order - a.sort_order);

          // Combine: Celebrity first, then Professional, take 22 total
          const combinedVoices = [...sortedCelebrity, ...sortedProfessional].slice(0, 22);
          setVoices(combinedVoices);
        } else {
          // For specific role filter
          const response = await listVoices({
            locale: selectedLanguage ?? undefined,
            role: selectedRole,
            is_active: true,
            page: 1,
            page_size: 22,
          });
          // Sort by sort_order descending
          const sortedVoices = response.voices.sort((a, b) => b.sort_order - a.sort_order);
          setVoices(sortedVoices);
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
    } else {
      // Stop previous and play new
      audioRef.current?.pause();
      const sampleUrl = getVoiceSampleUrl(voice);
      if (sampleUrl) {
        const audio = new Audio(sampleUrl);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play().catch(() => setPlayingId(null));
        audioRef.current = audio;
        setPlayingId(voice.id);
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
          {/* Stats Row */}
          <div className="flex justify-center gap-4 md:gap-8 mb-4">
            {STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-1 md:gap-3">
                {/* Laurel wreath left - hidden on mobile */}
                <svg className="hidden md:block w-8 h-12 text-yellow-500" viewBox="0 0 24 40" fill="currentColor">
                  <path d="M12 2C8 6 4 12 4 20s4 14 8 18c-2-4-3-10-3-18s1-14 3-18z" opacity="0.8"/>
                  <path d="M10 4C7 8 5 14 5 20s2 12 5 16c-1.5-4-2.5-9-2.5-16s1-12 2.5-16z" opacity="0.6"/>
                  <path d="M8 6C6 10 5 15 5 20s1 10 3 14c-1-3-1.5-8-1.5-14s.5-11 1.5-14z" opacity="0.4"/>
                </svg>

                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-yellow-400">{stat.value}</div>
                  <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    {stat.stars && (
                      <div className="flex">
                        {[...Array(stat.stars)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    <span>{stat.label}</span>
                  </div>
                </div>

                {/* Laurel wreath right - hidden on mobile */}
                <svg className="hidden md:block w-8 h-12 text-yellow-500 transform scale-x-[-1]" viewBox="0 0 24 40" fill="currentColor">
                  <path d="M12 2C8 6 4 12 4 20s4 14 8 18c-2-4-3-10-3-18s1-14 3-18z" opacity="0.8"/>
                  <path d="M10 4C7 8 5 14 5 20s2 12 5 16c-1.5-4-2.5-9-2.5-16s1-12 2.5-16z" opacity="0.6"/>
                  <path d="M8 6C6 10 5 15 5 20s1 10 3 14c-1-3-1.5-8-1.5-14s.5-11 1.5-14z" opacity="0.4"/>
                </svg>
              </div>
            ))}
          </div>

          {/* Main Headline */}
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              {t('ttsPromo.hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {t('ttsPromo.hero.titleCelebrities')}
              </span>
              {t('ttsPromo.hero.title2')}<br />
              {t('ttsPromo.hero.title3')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                {t('ttsPromo.hero.titlePoliticians')}
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t('ttsPromo.hero.description')}{' '}
              <span className="text-purple-400 font-semibold">{t('ttsPromo.hero.brandName')}</span>
            </p>
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
                {[...Array(22)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-full bg-gray-800 animate-pulse" />
                ))}
              </div>
              {/* Desktop: 12 + 10 layout */}
              <div className="hidden md:block">
                <div className="flex justify-center gap-4 mb-4">
                  {[...Array(12)].map((_, i) => (
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
                  <button
                    key={voice.id}
                    onClick={() => handlePlayVoice(voice)}
                    className="group relative aspect-square rounded-full overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      playingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      {playingId === voice.id ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </div>
                    {playingId === voice.id && (
                      <div className="absolute inset-0 border-3 border-purple-500 rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop: First row 12, second row 10 */}
              <div className="hidden md:block">
                {/* First row: 12 voices */}
                <div className="flex justify-center gap-4 mb-6">
                  {voices.slice(0, 12).map((voice) => (
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
                          playingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {playingId === voice.id ? (
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
                  {voices.slice(12, 22).map((voice) => (
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
                          playingId === voice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {playingId === voice.id ? (
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
      <section className="py-6 px-4 bg-gradient-to-t from-purple-900/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          {/* Features */}
          <div className="inline-flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="text-left">{t('ttsPromo.cta.aiVoiceCloning')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Download className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="text-left">{t('ttsPromo.cta.exportAudio')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Mic className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="text-left">{t('ttsPromo.cta.voiceModels')}</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <GradientButton
              size="lg"
              className="min-w-[280px] py-5 text-lg"
              onClick={handleGetStarted}
            >
              <Mic className="w-6 h-6 mr-2" />
              {t('ttsPromo.cta.startCreating')}
            </GradientButton>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            {t('ttsPromo.cta.noCreditCard')} • {t('ttsPromo.cta.freeTier')}
          </p>
        </div>
      </section>
    </div>
  );
}