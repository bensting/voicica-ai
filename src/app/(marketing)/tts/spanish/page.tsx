'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Spanish language TTS landing page - hardcoded content for SEO
// Texto a Voz AI Gratis

const CONTENT = {
  hero: {
    badge: '100% Gratis • Sin Registro',
    title1: 'AI',
    titleHighlight: 'Texto a Voz',
    title2: 'Gratis',
    subtitle: '3200+ Voces • 190+ Idiomas',
    description: 'Convierte texto en voz natural al instante. Voces de celebridades, locutores profesionales, o clona tu propia voz.',
    webVersion: 'Versión Web',
    tryNow: 'Empezar Gratis',
  },
  samples: {
    title1: 'Escucha Muestras',
    title2: 'de',
    titleHighlight: 'Voces AI',
    description: 'Clonación de voz ultrarrealista con emociones, tono y pronunciación natural.',
    noVoices: 'No hay voces para este idioma',
    exploreAll: 'Explorar 3200+ Voces',
  },
  cta: {
    feature1: '3200+ voces AI en 190+ idiomas',
    feature2: 'Descarga MP3/WAV ilimitada',
    feature3: 'Clona tu propia voz',
    feature4: 'Gratis para siempre',
    startCreating: 'Empezar a Crear Gratis',
    noCreditCard: 'Sin tarjeta de crédito',
    noSignup: 'Sin registro',
  },
  explore: {
    title: 'Explora Voces AI en Múltiples Idiomas',
    subtitle: 'Nuestro servicio de texto a voz soporta más de 190 idiomas. Elige el idioma que necesitas y comienza a crear contenido con voces AI de alta calidad.',
    exploreMore: 'Explorar Más',
  },
};

export default function SpanishTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'Voces' },
          { value: STATS_VALUES.languages, label: 'Idiomas' },
          { value: STATS_VALUES.free, label: 'Gratis', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="es-ES"
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
        currentLanguage="es-ES"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
