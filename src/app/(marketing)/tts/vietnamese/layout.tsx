import type { Metadata } from 'next';

// Vietnamese TTS Landing Page - SEO optimized metadata
// Chuyển văn bản thành giọng nói AI miễn phí - Voicica AI

export const metadata: Metadata = {
  title: 'Chuyển Văn Bản Thành Giọng Nói AI Miễn Phí | TTS Tiếng Việt - Voicica AI',
  description: 'Công cụ chuyển văn bản thành giọng nói AI miễn phí 100%, không cần đăng ký. 3200+ giọng nói, 190+ ngôn ngữ. Giọng người nổi tiếng, lồng tiếng chuyên nghiệp. Tải MP3/WAV không giới hạn.',
  keywords: [
    'chuyển văn bản thành giọng nói',
    'text to speech tiếng việt',
    'AI giọng nói',
    'TTS miễn phí',
    'đọc văn bản',
    'lồng tiếng AI',
    'tổng hợp giọng nói',
    'phần mềm đọc văn bản',
    'voicica',
    'text to speech free',
    'AI voice generator',
  ],
  openGraph: {
    title: 'Chuyển Văn Bản Thành Giọng Nói AI Miễn Phí | Voicica AI',
    description: 'Công cụ chuyển văn bản thành giọng nói AI miễn phí 100%. 3200+ giọng nói, 190+ ngôn ngữ. Không cần đăng ký.',
    url: 'https://voicica.ai/tts/vietnamese',
    siteName: 'Voicica AI',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/images/og-tts-vietnamese.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Chuyển Văn Bản Thành Giọng Nói AI Miễn Phí',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chuyển Văn Bản Thành Giọng Nói AI Miễn Phí | Voicica AI',
    description: 'Công cụ chuyển văn bản thành giọng nói AI miễn phí 100%. 3200+ giọng nói, 190+ ngôn ngữ.',
    images: ['/images/og-tts-vietnamese.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/tts/vietnamese',
    languages: {
      'vi-VN': 'https://voicica.ai/tts/vietnamese',
      'en-US': 'https://voicica.ai/tts',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VietnameseTTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
