import type { Metadata } from 'next';

// Korean TTS Landing Page - SEO optimized metadata
// AI 텍스트 음성 변환 무료 - Voicica AI

export const metadata: Metadata = {
  title: 'AI 텍스트 음성 변환 무료 | TTS 한국어 - Voicica AI',
  description: '무료 AI 텍스트 음성 변환 도구. 회원가입 불필요, 3200개 이상 음성, 190개 이상 언어 지원. 유명인 목소리, 전문 성우, 내 목소리 복제 가능. MP3/WAV 무제한 다운로드.',
  keywords: [
    '텍스트 음성 변환',
    'TTS 한국어',
    'AI 음성',
    'text to speech 한국어',
    '음성 합성',
    '무료 TTS',
    'AI 더빙',
    '음성 변환기',
    '보이스 클론',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'AI 텍스트 음성 변환 무료 | Voicica AI',
    description: '무료 AI 텍스트 음성 변환 도구. 3200개 이상 음성, 190개 이상 언어. 회원가입 불필요.',
    url: 'https://voicica.ai/tts/korean',
    siteName: 'Voicica AI',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-korean.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - AI 텍스트 음성 변환 무료',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 텍스트 음성 변환 무료 | Voicica AI',
    description: '무료 AI 텍스트 음성 변환 도구. 3200개 이상 음성, 190개 이상 언어.',
    images: ['/images/og-tts-korean.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/korean',
    languages: {
      'ko-KR': 'https://voicica.ai/tts/korean',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function KoreanTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
