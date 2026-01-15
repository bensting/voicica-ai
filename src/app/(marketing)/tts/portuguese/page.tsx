'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Portuguese language TTS landing page - hardcoded content for SEO
// Texto para Voz AI Grátis

const CONTENT = {
  hero: {
    badge: '100% Grátis • Sem Cadastro',
    title1: 'AI',
    titleHighlight: 'Texto para Voz',
    title2: 'Grátis',
    subtitle: '3200+ Vozes • 190+ Idiomas',
    description: 'Converta texto em voz natural instantaneamente. Vozes de celebridades, locutores profissionais, ou clone sua própria voz.',
    webVersion: 'Versão Web',
    tryNow: 'Começar Grátis',
  },
  samples: {
    title1: 'Ouça Amostras',
    title2: 'de',
    titleHighlight: 'Vozes AI',
    description: 'Clonagem de voz ultra-realista com emoções, tom e pronúncia natural.',
    noVoices: 'Não há vozes para este idioma',
    exploreAll: 'Explorar 3200+ Vozes',
  },
  cta: {
    feature1: '3200+ vozes AI em 190+ idiomas',
    feature2: 'Download MP3/WAV ilimitado',
    feature3: 'Clone sua própria voz',
    feature4: 'Grátis para sempre',
    startCreating: 'Começar a Criar Grátis',
    noCreditCard: 'Sem cartão de crédito',
    noSignup: 'Sem cadastro',
  },
  explore: {
    title: 'Explore Vozes AI em Vários Idiomas',
    subtitle: 'Nosso serviço de texto para voz suporta mais de 190 idiomas. Escolha o idioma que você precisa e comece a criar conteúdo com vozes AI de alta qualidade.',
    exploreMore: 'Explorar Mais',
  },
};

export default function PortugueseTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'Vozes' },
          { value: STATS_VALUES.languages, label: 'Idiomas' },
          { value: STATS_VALUES.free, label: 'Grátis', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="pt-BR"
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
        currentLanguage="pt-BR"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
