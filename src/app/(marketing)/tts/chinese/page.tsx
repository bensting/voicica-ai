'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Chinese Simplified language TTS landing page - hardcoded content for SEO
// AI 文字转语音 免费

const CONTENT = {
  hero: {
    badge: '100%免费 • 无需注册',
    title1: 'AI',
    titleHighlight: '文字转语音',
    title2: '免费',
    subtitle: '3200+种音色 • 190+种语言',
    description: '即刻将文字转换为自然语音。名人声音、专业配音员，或克隆你自己的声音。',
    webVersion: '网页版',
    tryNow: '免费开始',
  },
  samples: {
    title1: '试听真实的',
    title2: '',
    titleHighlight: 'AI语音样本',
    description: '超逼真的声音克隆，带有情感、语调和自然发音。',
    noVoices: '该语言暂无音色',
    exploreAll: '探索3200+种音色',
  },
  cta: {
    feature1: '190+种语言的3200+种AI音色',
    feature2: 'MP3/WAV无限下载',
    feature3: '克隆你的声音',
    feature4: '永久免费',
    startCreating: '免费开始创作',
    noCreditCard: '无需信用卡',
    noSignup: '无需注册',
  },
  explore: {
    title: '探索多语言AI音色',
    subtitle: '我们的文字转语音服务支持190多种语言。选择你需要的语言，开始创作高质量的AI语音内容。',
    exploreMore: '探索更多',
  },
};

export default function ChineseTTSPage() {
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
          { value: STATS_VALUES.languages, label: '语言' },
          { value: STATS_VALUES.free, label: '免费', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="zh-CN"
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
        currentLanguage="zh-CN"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
