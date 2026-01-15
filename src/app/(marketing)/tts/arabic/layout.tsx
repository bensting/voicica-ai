import type { Metadata } from 'next';

// Arabic TTS Landing Page - SEO optimized metadata
// تحويل النص إلى كلام بالذكاء الاصطناعي مجاناً - Voicica AI

export const metadata: Metadata = {
  title: 'تحويل النص إلى كلام مجاناً | Text to Speech عربي - Voicica AI',
  description: 'أداة تحويل النص إلى كلام بالذكاء الاصطناعي مجانية 100%. أكثر من 3200 صوت، أكثر من 190 لغة. بدون تسجيل. أصوات المشاهير، تعليق صوتي احترافي. تحميل MP3/WAV غير محدود.',
  keywords: [
    'تحويل النص إلى كلام',
    'text to speech عربي',
    'مولد صوت AI',
    'صوت AI مجاني',
    'TTS عربي',
    'قارئ نص',
    'تعليق صوتي AI',
    'تحويل الكتابة إلى صوت',
    'استنساخ الصوت',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'تحويل النص إلى كلام مجاناً | Voicica AI',
    description: 'أداة تحويل النص إلى كلام بالذكاء الاصطناعي مجانية 100%. أكثر من 3200 صوت، أكثر من 190 لغة.',
    url: 'https://voicica.ai/tts/arabic',
    siteName: 'Voicica AI',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-arabic.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - تحويل النص إلى كلام مجاناً',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تحويل النص إلى كلام مجاناً | Voicica AI',
    description: 'أداة تحويل النص إلى كلام بالذكاء الاصطناعي مجانية 100%. أكثر من 3200 صوت، أكثر من 190 لغة.',
    images: ['/images/og-tts-arabic.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/arabic',
    languages: {
      'ar-SA': 'https://voicica.ai/tts/arabic',
      'en-US': 'https://voicica.ai/tts',
      'hi-IN': 'https://voicica.ai/tts/hindi',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ArabicTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
