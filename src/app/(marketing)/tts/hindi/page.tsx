'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Hindi language TTS landing page - hardcoded content for SEO
// मुफ्त AI टेक्स्ट टू स्पीच टूल - हिंदी

// Hindi content
const CONTENT = {
  hero: {
    badge: '100% मुफ्त • साइन अप नहीं',
    title1: 'AI',
    titleHighlight: 'टेक्स्ट टू स्पीच',
    title2: 'मुफ्त',
    subtitle: '3200+ आवाज़ें • 190+ भाषाएं',
    description: 'टेक्स्ट को तुरंत प्राकृतिक आवाज़ में बदलें। सेलिब्रिटी आवाज़ें, प्रोफेशनल वॉइसओवर, या अपनी आवाज़ क्लोन करें।',
    webVersion: 'वेब वर्शन',
    tryNow: 'मुफ्त शुरू करें',
  },
  samples: {
    title1: 'असली',
    title2: 'के',
    titleHighlight: 'AI आवाज़ सैंपल सुनें',
    description: 'भावनाओं, टोन और प्राकृतिक उच्चारण के साथ यथार्थवादी वॉइस क्लोनिंग।',
    noVoices: 'इस भाषा के लिए कोई आवाज़ नहीं है',
    exploreAll: 'सभी 3200+ आवाज़ें देखें',
  },
  cta: {
    feature1: '190+ भाषाओं में 3200+ AI आवाज़ें',
    feature2: 'अनलिमिटेड MP3/WAV डाउनलोड',
    feature3: 'अपनी आवाज़ क्लोन करें',
    feature4: 'हमेशा 100% मुफ्त',
    startCreating: 'मुफ्त में बनाना शुरू करें',
    noCreditCard: 'क्रेडिट कार्ड नहीं चाहिए',
    noSignup: 'साइन अप नहीं चाहिए',
  },
  explore: {
    title: 'कई भाषाओं में AI आवाज़ें खोजें',
    subtitle: 'हमारी टेक्स्ट टू स्पीच सेवा 190+ भाषाओं का समर्थन करती है। अपनी पसंदीदा भाषा चुनें और उच्च-गुणवत्ता वाली AI आवाज़ों के साथ कंटेंट बनाना शुरू करें।',
    exploreMore: 'और देखें',
  },
};

export default function HindiTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'आवाज़ें' },
          { value: STATS_VALUES.languages, label: 'भाषाएं' },
          { value: STATS_VALUES.free, label: 'मुफ्त', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="hi-IN"
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
        currentLanguage="hi-IN"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
