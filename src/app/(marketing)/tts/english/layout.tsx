import type { Metadata } from 'next';

// English TTS Landing Page - SEO optimized metadata
// Free AI Text to Speech Generator - Voicica AI

export const metadata: Metadata = {
  title: 'Free AI Text to Speech Generator | English TTS Online - Voicica AI',
  description: 'Free AI text to speech generator with 3200+ natural voices in 190+ languages. Convert text to speech online instantly. Celebrity voices, professional narrators. Download MP3/WAV unlimited.',
  keywords: [
    'text to speech',
    'text to speech free',
    'AI voice generator',
    'TTS online',
    'free TTS',
    'text to audio',
    'voice generator',
    'AI text to speech',
    'natural voice',
    'voicica',
    'celebrity voice',
    'voice cloning',
    'speech synthesis',
  ],
  openGraph: {
    title: 'Free AI Text to Speech Generator | Voicica AI',
    description: 'Free AI text to speech with 3200+ voices in 190+ languages. No sign-up required.',
    url: 'https://voicica.ai/tts/english',
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-english.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Free AI Text to Speech Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Text to Speech Generator | Voicica AI',
    description: 'Free AI text to speech with 3200+ voices in 190+ languages.',
    images: ['/images/og-tts-english.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/english',
    languages: {
      'en-US': 'https://voicica.ai/tts/english',
      'th-TH': 'https://voicica.ai/tts/thai',
      'id-ID': 'https://voicica.ai/tts/indonesian',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}