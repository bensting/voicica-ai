'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Pause, Mic, Star, Download, Sparkles, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';
import { listVoices } from '@/actions/voice';
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
  { code: 'Celebrity', name: 'Celebrities', icon: '⭐' },
  { code: 'Professional', name: 'Professional', icon: '🎙️' },
];

// Stats data
const STATS = [
  { icon: '🏆', value: '10,000,000+', label: 'Downloads' },
  { icon: '⭐', value: '140k', label: 'Reviews', stars: 5 },
];

export default function TTSPromoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, setLocale } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Celebrity');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Stats Row */}
          <div className="flex justify-center gap-8 mb-12">
            {STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                {/* Laurel wreath left */}
                <svg className="w-8 h-12 text-yellow-500" viewBox="0 0 24 40" fill="currentColor">
                  <path d="M12 2C8 6 4 12 4 20s4 14 8 18c-2-4-3-10-3-18s1-14 3-18z" opacity="0.8"/>
                  <path d="M10 4C7 8 5 14 5 20s2 12 5 16c-1.5-4-2.5-9-2.5-16s1-12 2.5-16z" opacity="0.6"/>
                  <path d="M8 6C6 10 5 15 5 20s1 10 3 14c-1-3-1.5-8-1.5-14s.5-11 1.5-14z" opacity="0.4"/>
                </svg>

                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-yellow-400">{stat.value}</div>
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

                {/* Laurel wreath right */}
                <svg className="w-8 h-12 text-yellow-500 transform scale-x-[-1]" viewBox="0 0 24 40" fill="currentColor">
                  <path d="M12 2C8 6 4 12 4 20s4 14 8 18c-2-4-3-10-3-18s1-14 3-18z" opacity="0.8"/>
                  <path d="M10 4C7 8 5 14 5 20s2 12 5 16c-1.5-4-2.5-9-2.5-16s1-12 2.5-16z" opacity="0.6"/>
                  <path d="M8 6C6 10 5 15 5 20s1 10 3 14c-1-3-1.5-8-1.5-14s.5-11 1.5-14z" opacity="0.4"/>
                </svg>
              </div>
            ))}
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
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

          {/* App Store Buttons */}
          <div className="flex justify-center gap-4 mb-12">
            <a
              href="#"
              className="flex items-center gap-2 bg-black border border-gray-700 rounded-xl px-5 py-3 hover:bg-gray-900 transition-colors"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-400">Download on the</div>
                <div className="text-sm font-semibold text-white">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-black border border-gray-700 rounded-xl px-5 py-3 hover:bg-gray-900 transition-colors"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26 7.97L2.15 4.86c-.2-.2-.2-.51 0-.71l.71-.71c.2-.2.51-.2.71 0L6.68 6.55 5.26 7.97z"/>
                <path fill="#FBBC04" d="M5.26 16.03l-3.11 3.11c-.2.2-.2.51 0 .71l.71.71c.2.2.51.2.71 0l3.11-3.11-1.42-1.42z"/>
                <path fill="#4285F4" d="M12 3l8.49 4.91c.44.25.71.73.71 1.24v5.7c0 .51-.27.99-.71 1.24L12 21l-8.49-4.91c-.44-.25-.71-.73-.71-1.24v-5.7c0-.51.27-.99.71-1.24L12 3z"/>
                <path fill="#34A853" d="M12 3v18l8.49-4.91c.44-.25.71-.73.71-1.24v-5.7c0-.51-.27-.99-.71-1.24L12 3z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-400">GET IT ON</div>
                <div className="text-sm font-semibold text-white">Google Play</div>
              </div>
            </a>
          </div>

          {/* Phone Mockups - Placeholder */}
          <div className="flex justify-center gap-4 px-4">
            <div className="w-32 md:w-40 h-64 md:h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl" />
            <div className="w-36 md:w-48 h-72 md:h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl -mt-4" />
            <div className="w-32 md:w-40 h-64 md:h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ========== Voice Samples Section ========== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
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

          {/* Language Selector + Role Filter Tabs (same row) */}
          <div className="flex justify-center items-center gap-6 mb-8">
            {/* Language Selector */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full px-5 py-2.5 text-white transition-colors min-w-[160px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{selectedLangOption.flag}</span>
                  <span>{selectedLangOption.name}</span>
                </span>
                <ChevronUp className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? '' : 'rotate-180'}`} />
              </button>

              {/* Dropdown Menu - Opens upward */}
              {isLanguageDropdownOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
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
            <button
              onClick={() => handleRoleSelect('Celebrity')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedRole === 'Celebrity'
                  ? 'text-yellow-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <span className={selectedRole === 'Celebrity' ? '' : 'grayscale opacity-50'}>⭐</span>
              <span>{t('ttsPromo.filters.celebrities')}</span>
            </button>
            <button
              onClick={() => handleRoleSelect('Professional')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedRole === 'Professional'
                  ? 'text-yellow-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <span className={selectedRole === 'Professional' ? '' : 'grayscale opacity-50'}>🎙️</span>
              <span>{t('ttsPromo.filters.professional')}</span>
            </button>
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
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gray-800 animate-pulse" />
                  ))}
                </div>
                <div className="flex justify-center gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gray-800 animate-pulse" />
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
                <div className="flex justify-center gap-4 mb-4">
                  {voices.slice(0, 12).map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => handlePlayVoice(voice)}
                      className="group relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full overflow-hidden transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  ))}
                </div>
                {/* Second row: 10 voices */}
                <div className="flex justify-center gap-4">
                  {voices.slice(12, 22).map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => handlePlayVoice(voice)}
                      className="group relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full overflow-hidden transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">{t('ttsPromo.samples.noVoices')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== CTA Section ========== */}
      <section className="py-20 px-4 bg-gradient-to-t from-purple-900/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-gray-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>{t('ttsPromo.cta.aiVoiceCloning')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Download className="w-5 h-5 text-purple-400" />
              <span>{t('ttsPromo.cta.exportAudio')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Mic className="w-5 h-5 text-purple-400" />
              <span>{t('ttsPromo.cta.voiceModels')}</span>
            </div>
          </div>

          {/* CTA Button */}
          <GradientButton
            size="lg"
            className="min-w-[280px] py-5 text-lg"
            onClick={handleGetStarted}
          >
            <Mic className="w-6 h-6 mr-2" />
            {t('ttsPromo.cta.startCreating')}
          </GradientButton>

          <p className="mt-4 text-gray-500 text-sm">
            {t('ttsPromo.cta.noCreditCard')} • {t('ttsPromo.cta.freeTier')}
          </p>
        </div>
      </section>
    </div>
  );
}