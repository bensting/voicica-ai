'use client';

import {
  TTSHeroSection,
  VoiceSamplesSection,
  TTSCTASection,
  LanguageExploreGrid,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
} from '@/components/features/tts-promo';

// Vietnamese language TTS landing page - hardcoded content for SEO
// Chuyển văn bản thành giọng nói AI miễn phí

const CONTENT = {
  hero: {
    badge: '100% Miễn Phí • Không Cần Đăng Ký',
    title1: 'AI',
    titleHighlight: 'Text to Speech',
    title2: 'Miễn Phí',
    subtitle: '3200+ Giọng Nói • 190+ Ngôn Ngữ',
    description: 'Chuyển đổi văn bản thành giọng nói tự nhiên ngay lập tức. Giọng người nổi tiếng, lồng tiếng chuyên nghiệp, hoặc sao chép giọng nói của bạn.',
    webVersion: 'Phiên Bản Web',
    tryNow: 'Bắt Đầu Miễn Phí',
  },
  samples: {
    title1: 'Nghe Mẫu',
    title2: '',
    titleHighlight: 'Giọng Nói AI',
    description: 'Sao chép giọng nói siêu thực với cảm xúc, ngữ điệu và phát âm tự nhiên.',
    noVoices: 'Không có giọng nói cho ngôn ngữ này',
    exploreAll: 'Khám Phá 3200+ Giọng Nói',
  },
  cta: {
    feature1: '3200+ giọng nói AI trong 190+ ngôn ngữ',
    feature2: 'Tải MP3/WAV không giới hạn',
    feature3: 'Sao chép giọng nói của bạn',
    feature4: 'Miễn phí mãi mãi',
    startCreating: 'Bắt Đầu Tạo Miễn Phí',
    noCreditCard: 'Không cần thẻ tín dụng',
    noSignup: 'Không cần đăng ký',
  },
  explore: {
    title: 'Khám Phá Giọng Nói AI Đa Ngôn Ngữ',
    subtitle: 'Dịch vụ text to speech của chúng tôi hỗ trợ hơn 190 ngôn ngữ. Chọn ngôn ngữ bạn cần và bắt đầu tạo nội dung với giọng nói AI chất lượng cao.',
    exploreMore: 'Khám Phá Thêm',
  },
};

export default function VietnameseTTSPage() {
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
          { value: STATS_VALUES.voices, label: 'Giọng Nói' },
          { value: STATS_VALUES.languages, label: 'Ngôn Ngữ' },
          { value: STATS_VALUES.free, label: 'Miễn Phí', isFree: true },
        ]}
        webVersionText={CONTENT.hero.webVersion}
        tryNowText={CONTENT.hero.tryNow}
      />

      <VoiceSamplesSection
        defaultLanguage="vi-VN"
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
        currentLanguage="vi-VN"
        exploreMoreText={CONTENT.explore.exploreMore}
        exploreMoreHref="/studio/tts"
      />
    </div>
  );
}
