import type { Metadata } from 'next';

// Chinese Traditional TTS Landing Page - SEO optimized metadata
// AI 文字轉語音 免費 - Voicica AI

export const metadata: Metadata = {
  title: 'AI 文字轉語音免費 | 線上TTS語音合成 - Voicica AI',
  description: '免費AI文字轉語音工具，無需註冊。3200+種音色，190+種語言。名人聲音、專業配音員、複製你的聲音。MP3/WAV無限下載。',
  keywords: [
    '文字轉語音',
    'AI配音',
    '語音合成',
    'TTS線上',
    '免費配音',
    'AI聲音複製',
    '文本朗讀',
    '智能語音',
    '線上朗讀器',
    'voicica',
    'text to speech',
    'AI voice generator',
  ],
  openGraph: {
    title: 'AI 文字轉語音免費 | Voicica AI',
    description: '免費AI文字轉語音工具。3200+種音色，190+種語言。無需註冊。',
    url: 'https://voicica.ai/tts/chinese-traditional',
    siteName: 'Voicica AI',
    locale: 'zh_TW',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-chinese-traditional.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - AI 文字轉語音免費',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 文字轉語音免費 | Voicica AI',
    description: '免費AI文字轉語音工具。3200+種音色，190+種語言。',
    images: ['/images/og-tts-chinese-traditional.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/chinese-traditional',
    languages: {
      'zh-TW': 'https://voicica.ai/tts/chinese-traditional',
      'zh-CN': 'https://voicica.ai/tts/chinese',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChineseTraditionalTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
