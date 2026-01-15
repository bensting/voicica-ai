import type { Metadata } from 'next';

// Chinese Simplified TTS Landing Page - SEO optimized metadata
// AI 文字转语音 免费 - Voicica AI

export const metadata: Metadata = {
  title: 'AI 文字转语音免费 | 在线TTS语音合成 - Voicica AI',
  description: '免费AI文字转语音工具，无需注册。3200+种音色，190+种语言。名人声音、专业配音员、克隆你的声音。MP3/WAV无限下载。',
  keywords: [
    '文字转语音',
    'AI配音',
    '语音合成',
    'TTS在线',
    '免费配音',
    'AI声音克隆',
    '文本朗读',
    '智能语音',
    '在线朗读器',
    'voicica',
    'text to speech',
    'AI voice generator',
  ],
  openGraph: {
    title: 'AI 文字转语音免费 | Voicica AI',
    description: '免费AI文字转语音工具。3200+种音色，190+种语言。无需注册。',
    url: 'https://voicica.ai/tts/chinese',
    siteName: 'Voicica AI',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-chinese.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - AI 文字转语音免费',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 文字转语音免费 | Voicica AI',
    description: '免费AI文字转语音工具。3200+种音色，190+种语言。',
    images: ['/images/og-tts-chinese.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/chinese',
    languages: {
      'zh-CN': 'https://voicica.ai/tts/chinese',
      'zh-TW': 'https://voicica.ai/tts/chinese-traditional',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChineseTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
