'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Download, Sparkles, Globe, Check } from 'lucide-react';
import { GradientButton } from '@/components/ui';
import { AdBanner } from '@/components/ads';
import {
  VoiceSampleGrid,
  LanguageDropdown,
  RoleFilterTabs,
  LanguageExploreGrid,
  type LanguageOption,
  type RoleOption,
  type LanguageCardItem,
} from '@/components/features/tts-promo';
import { getPromoVoices } from '@/actions/voice';
import { getLatestRelease, incrementDownloadCountByVersion } from '@/actions/admin/app-releases';
import type { Voice } from '@/types/voice';

// Indonesian language TTS landing page - hardcoded content for SEO
// Text to Speech AI Gratis Bahasa Indonesia

// Language options - Indonesian first, then Southeast Asian languages
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ms-MY', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl-PH', name: 'Filipino', flag: '🇵🇭' },
];

// Role filter options - Indonesian
const ROLE_OPTIONS: RoleOption[] = [
  { code: 'All', name: 'Semua', icon: '🔥' },
  { code: 'Celebrity', name: 'Selebriti', icon: '⭐' },
  { code: 'Professional', name: 'Profesional', icon: '🎙️' },
];

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
    downloadApk: 'Unduh',
    comingSoon: 'Segera Hadir',
    tryNow: 'Mulai Gratis',
    webVersion: 'Versi Web',
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('id-ID');
  const [selectedRole, setSelectedRole] = useState('All');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

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
    await incrementDownloadCountByVersion('android', apkInfo.version);
    window.open(apkInfo.download_url, '_blank');
  };

  // Load voices using cached API
  useEffect(() => {
    async function loadVoices() {
      setLoading(true);
      try {
        if (selectedRole === 'All') {
          // Fetch both Celebrity and Professional, combine them
          const [celebrityVoices, professionalVoices] = await Promise.all([
            getPromoVoices(selectedLanguage, 'Celebrity', 20),
            getPromoVoices(selectedLanguage, 'Professional', 20),
          ]);
          const combinedVoices = [...celebrityVoices, ...professionalVoices].slice(0, 22);
          setVoices(combinedVoices);
        } else {
          const result = await getPromoVoices(selectedLanguage, selectedRole, 20);
          setVoices(result);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVoices();
  }, [selectedLanguage, selectedRole]);

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
  };

  const handleRoleSelect = (code: string) => {
    setSelectedRole(code);
  };

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
              <span className="text-green-400 text-sm font-medium">{CONTENT.hero.badge}</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              {CONTENT.hero.title1}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {CONTENT.hero.titleHighlight1}
              </span>
              <br />
              {CONTENT.hero.title2}
            </h1>

            {/* Subtitle with stats */}
            <p className="text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-3">
              {CONTENT.hero.subtitle}
            </p>

            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {CONTENT.hero.description}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-6 md:gap-10 mb-6">
            {STATS_CONFIG.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl md:text-3xl font-bold ${stat.isFree ? 'text-green-400' : 'text-purple-400'}`}>
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Download & Try Buttons */}
          <div className={`flex justify-center gap-3 ${deviceType === 'desktop' ? 'flex-wrap' : ''}`}>
            {/* Android APK */}
            {deviceType !== 'ios' && (
              apkInfo ? (
                <button
                  onClick={handleApkDownload}
                  className={`flex items-center gap-3 bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{CONTENT.hero.downloadApk}</div>
                    <div className="text-sm font-semibold text-white">Android</div>
                  </div>
                </button>
              ) : (
                <div className={`flex items-center gap-3 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 opacity-50 cursor-not-allowed ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}>
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Android</div>
                    <div className="text-sm font-semibold text-gray-400">{CONTENT.hero.comingSoon}</div>
                  </div>
                </div>
              )
            )}

            {/* iOS */}
            {deviceType !== 'android' && (
              <div className={`flex items-center gap-3 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 opacity-50 cursor-not-allowed ${deviceType === 'desktop' ? 'w-[180px]' : 'flex-1 max-w-[180px]'}`}>
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">iOS</div>
                  <div className="text-sm font-semibold text-gray-400">{CONTENT.hero.comingSoon}</div>
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
                <div className="text-[10px] text-purple-200 uppercase tracking-wide whitespace-nowrap">{CONTENT.hero.tryNow}</div>
                <div className="text-sm font-semibold text-white whitespace-nowrap">{CONTENT.hero.webVersion}</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <AdBanner slot="TTS_HERO_BOTTOM" variant="section" className="bg-[#0a0a0f]" />

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

          {/* Language Selector + Role Filter */}
          <div className="flex justify-center mb-4 px-2">
            <div className="flex items-center gap-0.5 md:gap-1 bg-gray-800/50 border border-gray-700 rounded-full px-1.5 md:px-2 py-1">
              <LanguageDropdown
                options={LANGUAGE_OPTIONS}
                selected={selectedLanguage}
                onSelect={handleLanguageSelect}
              />
              <RoleFilterTabs
                options={ROLE_OPTIONS}
                selected={selectedRole}
                onSelect={handleRoleSelect}
              />
            </div>
          </div>

          {/* Voice Grid */}
          <VoiceSampleGrid
            voices={voices}
            loading={loading}
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