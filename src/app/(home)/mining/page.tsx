import type { Metadata } from 'next';
import { buildSeoUrl, buildAlternates } from '@/config/seo/locales';
import { MINING_CONTENT } from '@/config/seo/mining';
import MiningPageContent from './MiningPageContent';

export const metadata: Metadata = {
  title: MINING_CONTENT.en.metadata.title,
  description: MINING_CONTENT.en.metadata.description,
  keywords: MINING_CONTENT.en.metadata.keywords,
  alternates: {
    canonical: buildSeoUrl('', 'mining'),
    languages: buildAlternates('mining'),
  },
  openGraph: {
    title: MINING_CONTENT.en.metadata.title,
    description: MINING_CONTENT.en.metadata.description,
    url: buildSeoUrl('', 'mining'),
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function MiningPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://voicica.ai',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Mining',
            item: buildSeoUrl('', 'mining'),
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Voicica Pro — AI Mining',
        url: buildSeoUrl('', 'mining'),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MiningPageContent locale="en" />
    </>
  );
}
