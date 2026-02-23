import type { Metadata } from 'next';
import { buildSeoUrl, buildAlternates } from '@/config/seo/locales';
import MiningPageContent from './MiningPageContent';

export const metadata: Metadata = {
  title: 'AI Mining — Decentralized AI Compute Power | Voicica',
  description:
    'Turn your phone into an AI compute node and earn daily rewards. Download Voicica Pro to join the decentralized AI power network.',
  keywords: [
    'AI mining',
    'decentralized AI',
    'compute node',
    'earn crypto',
    'Voicica Pro',
    'AI power network',
    'mobile mining',
  ],
  alternates: {
    canonical: buildSeoUrl('', 'mining'),
    languages: buildAlternates('mining'),
  },
  openGraph: {
    title: 'AI Mining — Decentralized AI Compute Power | Voicica',
    description:
      'Turn your phone into an AI compute node and earn daily rewards.',
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
