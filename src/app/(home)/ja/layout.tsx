import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voicica AI - 無料AI音声生成、音楽・画像作成ツール',
  description:
    '無料AIプラットフォーム：3200以上の音声でテキスト読み上げ、AI音楽生成、AI画像作成、動画ダウンロード、HD高画質化、背景削除。',
  keywords: [
    'AI音声',
    'テキスト読み上げ',
    'AI音楽生成',
    'AI画像生成',
    '動画ダウンロード',
    '画像高画質化',
    '背景削除',
    '無料AIツール',
  ],
  alternates: {
    canonical: 'https://voicica.ai/ja',
    languages: {
      en: 'https://voicica.ai',
      ja: 'https://voicica.ai/ja',
    },
  },
  openGraph: {
    title: 'Voicica AI - 無料AI音声生成、音楽・画像作成ツール',
    description:
      '無料AIプラットフォーム：3200以上の音声でテキスト読み上げ、AI音楽生成、AI画像作成、動画ダウンロード、HD高画質化、背景削除。',
    url: 'https://voicica.ai/ja',
    siteName: 'Voicica AI',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function JaHomeLayout({
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
        url: 'https://voicica.ai/ja',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        inLanguage: 'ja',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          '3200以上の音声によるAIテキスト読み上げ',
          'AI音楽ジェネレーター',
          'AI画像クリエイター',
          '無料動画ダウンローダー',
          'HD画像アップスケーラー',
          '背景削除ツール',
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
