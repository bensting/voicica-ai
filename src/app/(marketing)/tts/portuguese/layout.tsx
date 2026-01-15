import type { Metadata } from 'next';

// Portuguese TTS Landing Page - SEO optimized metadata
// Texto para Voz AI Grátis - Voicica AI

export const metadata: Metadata = {
  title: 'Texto para Voz AI Grátis | Conversor TTS em Português - Voicica AI',
  description: 'Ferramenta gratuita de texto para voz com IA. Sem cadastro, 3200+ vozes, 190+ idiomas. Vozes de celebridades, locutores profissionais. Download MP3/WAV ilimitado.',
  keywords: [
    'texto para voz',
    'text to speech português',
    'voz AI grátis',
    'TTS português',
    'conversor de voz',
    'leitor de texto',
    'síntese de voz',
    'gerador de voz AI',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'Texto para Voz AI Grátis | Voicica AI',
    description: 'Ferramenta gratuita de texto para voz com IA. 3200+ vozes, 190+ idiomas. Sem cadastro.',
    url: 'https://voicica.ai/tts/portuguese',
    siteName: 'Voicica AI',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-portuguese.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Texto para Voz AI Grátis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texto para Voz AI Grátis | Voicica AI',
    description: 'Ferramenta gratuita de texto para voz com IA. 3200+ vozes, 190+ idiomas.',
    images: ['/images/og-tts-portuguese.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/portuguese',
    languages: {
      'pt-BR': 'https://voicica.ai/tts/portuguese',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PortugueseTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
