'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Korean language TTS landing page - hardcoded content for SEO
// AI 텍스트 음성 변환 무료

const CONTENT = {
  hero: {
    badge: '100% 무료 • 가입 불필요',
    title1: 'AI',
    titleHighlight: '텍스트 음성 변환',
    title2: '무료',
    subtitle: '3200개 이상 음성 • 190개 이상 언어',
    description: '텍스트를 자연스러운 음성으로 즉시 변환. 유명인 목소리, 전문 성우, 또는 내 목소리 복제도 가능.',
    webVersion: '웹 버전',
    tryNow: '무료로 시작',
  },
  samples: {
    title1: '실제',
    title2: '',
    titleHighlight: 'AI 음성 샘플',
    description: '감정, 톤, 자연스러운 발음을 갖춘 초현실적인 음성 복제.',
    noVoices: '이 언어의 음성이 없습니다',
    exploreAll: '3200개 이상 음성 탐색',
  },
  cta: {
    feature1: '190개 이상 언어로 3200개 이상 AI 음성',
    feature2: 'MP3/WAV 무제한 다운로드',
    feature3: '내 목소리 복제',
    feature4: '영원히 무료',
    startCreating: '무료로 제작 시작',
    noCreditCard: '신용카드 불필요',
    noSignup: '가입 불필요',
  },
  explore: {
    title: '다양한 언어로 AI 음성 탐색',
    subtitle: '저희 텍스트 음성 변환 서비스는 190개 이상의 언어를 지원합니다. 원하는 언어를 선택하고 고품질 AI 음성 콘텐츠 제작을 시작하세요.',
    exploreMore: '더 보기',
  },
};

export default function KoreanTTSPage() {
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
          { value: STATS_VALUES.voices, label: '음성' },
          { value: STATS_VALUES.languages, label: '언어' },
          { value: STATS_VALUES.free, label: '무료', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="ko-KR"
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
        currentLanguage="ko-KR"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
