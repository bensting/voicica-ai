import type { Metadata } from 'next';

// Thai TTS Landing Page - SEO optimized metadata
// แปลงข้อความเป็นเสียง AI ฟรี - Voicica AI

export const metadata: Metadata = {
  title: 'แปลงข้อความเป็นเสียง AI ฟรี | Text to Speech ภาษาไทย - Voicica AI',
  description: 'เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี 100% ไม่ต้องสมัครสมาชิก 3200+ เสียง 190+ ภาษา เสียงคนดัง นักพากย์มืออาชีพ ดาวน์โหลด MP3/WAV ไม่จำกัด',
  keywords: [
    'แปลงข้อความเป็นเสียง',
    'text to speech ภาษาไทย',
    'AI พากย์เสียง',
    'เสียง AI ฟรี',
    'โปรแกรมพากย์เสียง',
    'แปลงตัวอักษรเป็นเสียง',
    'TTS ภาษาไทย',
    'เครื่องอ่านข้อความ',
    'พากย์เสียงอัตโนมัติ',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'แปลงข้อความเป็นเสียง AI ฟรี | Voicica AI',
    description: 'เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี 100% 3200+ เสียง 190+ ภาษา ไม่ต้องสมัครสมาชิก',
    url: 'https://voicica.ai/tts/thai',
    siteName: 'Voicica AI',
    locale: 'th_TH',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-thai.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - แปลงข้อความเป็นเสียง AI ฟรี',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'แปลงข้อความเป็นเสียง AI ฟรี | Voicica AI',
    description: 'เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี 100% 3200+ เสียง 190+ ภาษา',
    images: ['/images/og-tts-thai.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/thai',
    languages: {
      'th-TH': 'https://voicica.ai/tts/thai',
      'en-US': 'https://voicica.ai/tts',
      'id-ID': 'https://voicica.ai/tts/indonesian',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ThaiTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}