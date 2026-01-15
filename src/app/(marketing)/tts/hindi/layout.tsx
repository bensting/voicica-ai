import type { Metadata } from 'next';

// Hindi TTS Landing Page - SEO optimized metadata
// मुफ्त AI टेक्स्ट टू स्पीच - Voicica AI

export const metadata: Metadata = {
  title: 'मुफ्त AI टेक्स्ट टू स्पीच | हिंदी Text to Speech - Voicica AI',
  description: '100% मुफ्त AI टेक्स्ट टू स्पीच टूल। 3200+ आवाज़ें, 190+ भाषाएं। बिना साइन अप के। सेलिब्रिटी आवाज़ें, प्रोफेशनल वॉइसओवर। MP3/WAV अनलिमिटेड डाउनलोड।',
  keywords: [
    'टेक्स्ट टू स्पीच',
    'text to speech hindi',
    'AI वॉइस जनरेटर',
    'मुफ्त AI आवाज़',
    'हिंदी TTS',
    'टेक्स्ट से आवाज़',
    'वॉइसओवर AI',
    'ऑनलाइन टेक्स्ट रीडर',
    'आवाज़ क्लोनिंग',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'मुफ्त AI टेक्स्ट टू स्पीच | Voicica AI',
    description: '100% मुफ्त AI टेक्स्ट टू स्पीच टूल। 3200+ आवाज़ें, 190+ भाषाएं। बिना साइन अप के।',
    url: 'https://voicica.ai/tts/hindi',
    siteName: 'Voicica AI',
    locale: 'hi_IN',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-hindi.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - मुफ्त AI टेक्स्ट टू स्पीच',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'मुफ्त AI टेक्स्ट टू स्पीच | Voicica AI',
    description: '100% मुफ्त AI टेक्स्ट टू स्पीच टूल। 3200+ आवाज़ें, 190+ भाषाएं।',
    images: ['/images/og-tts-hindi.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/hindi',
    languages: {
      'hi-IN': 'https://voicica.ai/tts/hindi',
      'en-US': 'https://voicica.ai/tts',
      'th-TH': 'https://voicica.ai/tts/thai',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HindiTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
