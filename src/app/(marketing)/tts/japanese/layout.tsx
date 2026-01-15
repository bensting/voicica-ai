import type { Metadata } from 'next';

// Japanese TTS Landing Page - SEO optimized metadata
// AI テキスト読み上げ 無料 - Voicica AI

export const metadata: Metadata = {
  title: 'AI テキスト読み上げ 無料 | 音声合成・Text to Speech - Voicica AI',
  description: '無料のAIテキスト読み上げツール。登録不要、3200以上の音声、190以上の言語対応。有名人の声、プロのナレーター、自分の声のクローンも可能。MP3/WAVダウンロード無制限。',
  keywords: [
    'テキスト読み上げ',
    '音声合成',
    'AI 音声',
    'text to speech 日本語',
    'TTS 無料',
    '読み上げソフト',
    'ナレーション AI',
    '音声変換',
    'ボイスチェンジャー',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'AI テキスト読み上げ 無料 | Voicica AI',
    description: '無料のAIテキスト読み上げツール。3200以上の音声、190以上の言語。登録不要。',
    url: 'https://voicica.ai/tts/japanese',
    siteName: 'Voicica AI',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-japanese.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - AI テキスト読み上げ 無料',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI テキスト読み上げ 無料 | Voicica AI',
    description: '無料のAIテキスト読み上げツール。3200以上の音声、190以上の言語。',
    images: ['/images/og-tts-japanese.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/japanese',
    languages: {
      'ja-JP': 'https://voicica.ai/tts/japanese',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function JapaneseTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
