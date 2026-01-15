import type { Metadata } from 'next';

// Spanish TTS Landing Page - SEO optimized metadata
// Texto a Voz AI Gratis - Voicica AI

export const metadata: Metadata = {
  title: 'Texto a Voz AI Gratis | Convertidor TTS en Español - Voicica AI',
  description: 'Herramienta gratuita de texto a voz con IA. Sin registro, 3200+ voces, 190+ idiomas. Voces de celebridades, locutores profesionales. Descarga MP3/WAV ilimitada.',
  keywords: [
    'texto a voz',
    'text to speech español',
    'voz AI gratis',
    'TTS español',
    'convertidor de voz',
    'lector de texto',
    'síntesis de voz',
    'generador de voz AI',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'Texto a Voz AI Gratis | Voicica AI',
    description: 'Herramienta gratuita de texto a voz con IA. 3200+ voces, 190+ idiomas. Sin registro.',
    url: 'https://voicica.ai/tts/spanish',
    siteName: 'Voicica AI',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-spanish.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Texto a Voz AI Gratis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texto a Voz AI Gratis | Voicica AI',
    description: 'Herramienta gratuita de texto a voz con IA. 3200+ voces, 190+ idiomas.',
    images: ['/images/og-tts-spanish.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/spanish',
    languages: {
      'es-ES': 'https://voicica.ai/tts/spanish',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SpanishTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
