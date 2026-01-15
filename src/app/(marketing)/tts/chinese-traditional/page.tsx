'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Chinese Traditional language TTS landing page - hardcoded content for SEO
// AI 文字轉語音 免費

const CONTENT = {
  hero: {
    badge: '100%免費 • 無需註冊',
    title1: 'AI',
    titleHighlight: '文字轉語音',
    title2: '免費',
    subtitle: '3200+種音色 • 190+種語言',
    description: '即刻將文字轉換為自然語音。名人聲音、專業配音員，或複製你自己的聲音。',
    webVersion: '網頁版',
    tryNow: '免費開始',
  },
  samples: {
    title1: '試聽真實的',
    title2: '',
    titleHighlight: 'AI語音樣本',
    description: '超逼真的聲音複製，帶有情感、語調和自然發音。',
    noVoices: '該語言暫無音色',
    exploreAll: '探索3200+種音色',
  },
  cta: {
    feature1: '190+種語言的3200+種AI音色',
    feature2: 'MP3/WAV無限下載',
    feature3: '複製你的聲音',
    feature4: '永久免費',
    startCreating: '免費開始創作',
    noCreditCard: '無需信用卡',
    noSignup: '無需註冊',
  },
  explore: {
    title: '探索多語言AI音色',
    subtitle: '我們的文字轉語音服務支援190多種語言。選擇你需要的語言，開始創作高品質的AI語音內容。',
    exploreMore: '探索更多',
  },
};

export default function ChineseTraditionalTTSPage() {
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
          { value: STATS_VALUES.voices, label: '音色' },
          { value: STATS_VALUES.languages, label: '語言' },
          { value: STATS_VALUES.free, label: '免費', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="zh-TW"
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
        currentLanguage="zh-TW"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
