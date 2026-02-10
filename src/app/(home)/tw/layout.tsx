import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voicica AI - 免費AI語音生成、音樂與圖片創作工具',
  description:
    '免費AI平台：3200+語音文字轉語音、AI音樂生成、AI圖片創作、影片下載、HD高畫質化、背景移除。',
  keywords: [
    'AI語音',
    '文字轉語音',
    'AI音樂生成',
    'AI圖片生成',
    '影片下載',
    '圖片高畫質化',
    '背景移除',
    '免費AI工具',
  ],
  alternates: {
    canonical: 'https://voicica.ai/tw',
    languages: {
      en: 'https://voicica.ai',
      ja: 'https://voicica.ai/ja',
      'zh-Hant': 'https://voicica.ai/tw',
    },
  },
  openGraph: {
    title: 'Voicica AI - 免費AI語音生成、音樂與圖片創作工具',
    description:
      '免費AI平台：3200+語音文字轉語音、AI音樂生成、AI圖片創作、影片下載、HD高畫質化、背景移除。',
    url: 'https://voicica.ai/tw',
    siteName: 'Voicica AI',
    locale: 'zh_TW',
    type: 'website',
  },
};

export default function TwHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Voicica AI',
        url: 'https://voicica.ai',
      },
      {
        '@type': 'Organization',
        name: 'Voicica AI',
        url: 'https://voicica.ai',
        logo: 'https://voicica.ai/icons/icon-512x512.png',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Voicica AI',
        url: 'https://voicica.ai/tw',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        inLanguage: 'zh-Hant',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          '3200+語音的AI文字轉語音',
          'AI音樂生成器',
          'AI圖片創作器',
          '免費影片下載器',
          'HD圖片高畫質化',
          '背景移除工具',
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
