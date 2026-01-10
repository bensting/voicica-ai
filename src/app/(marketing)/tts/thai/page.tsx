'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Thai language TTS landing page - hardcoded content for SEO
// เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี ภาษาไทย

// Thai content
const CONTENT = {
  hero: {
    badge: 'ฟรี 100% • ไม่ต้องสมัคร',
    title1: 'AI',
    titleHighlight: 'แปลงข้อความเป็นเสียง',
    title2: 'ฟรี',
    subtitle: '3200+ เสียง • 190+ ภาษา',
    description: 'แปลงข้อความเป็นเสียงพูดธรรมชาติทันที เสียงคนดัง นักพากย์มืออาชีพ หรือโคลนเสียงของคุณเอง',
    webVersion: 'เวอร์ชันเว็บ',
    tryNow: 'เริ่มฟรี',
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
  explore: {
    title: 'สำรวจเสียง AI ในหลายภาษา',
    subtitle: 'บริการแปลงข้อความเป็นเสียงของเรารองรับมากกว่า 190 ภาษา เลือกภาษาที่คุณต้องการและเริ่มสร้างเนื้อหาด้วยเสียง AI คุณภาพสูง',
    exploreMore: 'สำรวจเพิ่มเติม',
  },
};

export default function ThaiTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'เสียง' },
          { value: STATS_VALUES.languages, label: 'ภาษา' },
          { value: STATS_VALUES.free, label: 'ฟรี', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="th-TH"
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
        currentLanguage="th-TH"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}