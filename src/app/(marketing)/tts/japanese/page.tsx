'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Japanese language TTS landing page - hardcoded content for SEO
// AI テキスト読み上げ 無料

const CONTENT = {
  hero: {
    badge: '100%無料 • 登録不要',
    title1: 'AI',
    titleHighlight: 'テキスト読み上げ',
    title2: '無料',
    subtitle: '3200以上の音声 • 190以上の言語',
    description: 'テキストを自然な音声に即座に変換。有名人の声、プロのナレーター、または自分の声のクローンも可能。',
    webVersion: 'ウェブ版',
    tryNow: '無料で始める',
  },
  samples: {
    title1: '実際の',
    title2: '',
    titleHighlight: 'AI音声サンプル',
    description: '感情、トーン、自然な発音を備えた超リアルな音声クローン。',
    noVoices: 'この言語の音声はありません',
    exploreAll: '3200以上の音声を探索',
  },
  cta: {
    feature1: '190以上の言語で3200以上のAI音声',
    feature2: 'MP3/WAV無制限ダウンロード',
    feature3: '自分の声をクローン',
    feature4: '永久無料',
    startCreating: '無料で作成開始',
    noCreditCard: 'クレジットカード不要',
    noSignup: '登録不要',
  },
  explore: {
    title: '多言語でAI音声を探索',
    subtitle: '当社のテキスト読み上げサービスは190以上の言語をサポート。お好みの言語を選んで、高品質なAI音声コンテンツの作成を始めましょう。',
    exploreMore: 'もっと見る',
  },
};

export default function JapaneseTTSPage() {
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
          { value: STATS_VALUES.voices, label: '音声' },
          { value: STATS_VALUES.languages, label: '言語' },
          { value: STATS_VALUES.free, label: '無料', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="ja-JP"
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
        currentLanguage="ja-JP"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
