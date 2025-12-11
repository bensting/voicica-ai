import type { Metadata } from 'next';

// Indonesian TTS Landing Page - SEO optimized metadata
// Text to Speech AI Gratis Bahasa Indonesia - Voicica AI

export const metadata: Metadata = {
  title: 'Text to Speech AI Gratis | Ubah Teks Jadi Suara - Voicica AI',
  description: 'Aplikasi text to speech AI gratis 100% tanpa daftar. 3200+ suara, 190+ bahasa. Suara selebriti, narator profesional. Unduh MP3/WAV tanpa batas.',
  keywords: [
    'text to speech indonesia',
    'text to speech gratis',
    'ubah teks jadi suara',
    'TTS bahasa indonesia',
    'AI suara gratis',
    'pengubah teks ke suara',
    'aplikasi text to speech',
    'suara AI indonesia',
    'pembaca teks otomatis',
    'voicica',
    'text to speech free',
    'AI voice generator',
    'konversi teks ke audio',
  ],
  openGraph: {
    title: 'Text to Speech AI Gratis | Voicica AI',
    description: 'Aplikasi text to speech AI gratis 100%. 3200+ suara, 190+ bahasa. Tanpa perlu daftar.',
    url: 'https://voicica.ai/tts/indonesian',
    siteName: 'Voicica AI',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-indonesian.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Text to Speech AI Gratis Bahasa Indonesia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text to Speech AI Gratis | Voicica AI',
    description: 'Aplikasi text to speech AI gratis 100%. 3200+ suara, 190+ bahasa.',
    images: ['/images/og-tts-indonesian.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/indonesian',
    languages: {
      'id-ID': 'https://voicica.ai/tts/indonesian',
      'en-US': 'https://voicica.ai/tts',
      'th-TH': 'https://voicica.ai/tts/thai',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function IndonesianTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}