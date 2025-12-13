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
  TTSHeroSection,
  type LanguageOption,
  type RoleOption,
  type LanguageCardItem,
} from '@/components/features/tts-promo';
import { getPromoVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';

// Thai language TTS landing page - hardcoded content for SEO
// เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี ภาษาไทย

// Language options - Thai first, then Southeast Asian languages
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ms-MY', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl-PH', name: 'Filipino', flag: '🇵🇭' },
];

// Role filter options - Thai
const ROLE_OPTIONS: RoleOption[] = [
  { code: 'All', name: 'ทั้งหมด', icon: '🔥' },
  { code: 'Celebrity', name: 'คนดัง', icon: '⭐' },
  { code: 'Professional', name: 'มืออาชีพ', icon: '🎙️' },
];

// Stats data - Thai
const STATS_CONFIG = [
  { value: '3200+', label: 'เสียง', highlight: true },
  { value: '190+', label: 'ภาษา', highlight: true },
  { value: '100%', label: 'ฟรี', highlight: true, isFree: true },
];

// Language explore grid - links to other language pages
const EXPLORE_LANGUAGES: LanguageCardItem[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸', href: '/tts/english' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭', href: '/tts/thai' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', href: '/tts/indonesian' },
];

// Thai content translations
const CONTENT = {
  hero: {
    badge: 'ฟรี 100% • ไม่ต้องสมัคร',
    title1: 'AI',
    titleHighlight1: 'แปลงข้อความเป็นเสียง',
    title2: 'ฟรี',
    subtitle: '3200+ เสียง • 190+ ภาษา',
    description: 'แปลงข้อความเป็นเสียงพูดธรรมชาติทันที เสียงคนดัง นักพากย์มืออาชีพ หรือโคลนเสียงของคุณเอง',
    downloadApk: 'ดาวน์โหลด',
    comingSoon: 'เร็วๆ นี้',
    tryNow: 'เริ่มฟรี',
    webVersion: 'เวอร์ชันเว็บ',
  },
  samples: {
    title1: 'ฟังตัวอย่างจริง',
    title2: 'ของ',
    titleHighlight: 'เสียง AI',
    description: 'การโคลนเสียงที่สมจริงมากพร้อมอารมณ์ โทนเสียง และการออกเสียงธรรมชาติ',
    noVoices: 'ไม่มีเสียงสำหรับภาษานี้',
    exploreAll: 'สำรวจเสียงทั้งหมด 3200+',
  },
  cta: {
    feature1: '3200+ เสียง AI ใน 190+ ภาษา',
    feature2: 'ดาวน์โหลด MP3/WAV ไม่จำกัด',
    feature3: 'โคลนเสียงของคุณเอง',
    feature4: 'ฟรี 100% ตลอดไป',
    startCreating: 'เริ่มสร้างฟรี',
    noCreditCard: 'ไม่ต้องใช้บัตรเครดิต',
    noSignup: 'ไม่ต้องสมัครสมาชิก',
  },
};

export default function ThaiTTSPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('th-TH');
  const [selectedRole, setSelectedRole] = useState('All');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

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
      <TTSHeroSection
        badge={CONTENT.hero.badge}
        title1={CONTENT.hero.title1}
        titleHighlight={CONTENT.hero.titleHighlight1}
        title2={CONTENT.hero.title2}
        subtitle={CONTENT.hero.subtitle}
        description={CONTENT.hero.description}
        stats={STATS_CONFIG}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

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
        title="สำรวจเสียง AI ในหลายภาษา"
        subtitle="บริการแปลงข้อความเป็นเสียงของเรารองรับมากกว่า 190 ภาษา เลือกภาษาที่คุณต้องการและเริ่มสร้างเนื้อหาด้วยเสียง AI คุณภาพสูง"
        languages={EXPLORE_LANGUAGES}
        currentLanguage="th-TH"
        exploreMoreText="สำรวจเพิ่มเติม"
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}