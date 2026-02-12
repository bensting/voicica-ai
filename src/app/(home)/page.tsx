import type { Metadata } from 'next';
import { NewHero } from '@/components/sections/new-home';
import HomepageContent from '@/components/sections/seo/HomepageContent';
import { buildAlternates, buildSeoUrl } from '@/config/seo/locales';
import { HOMEPAGE_CONTENT } from '@/config/seo/homepage';

export const metadata: Metadata = {
  title: HOMEPAGE_CONTENT.en.metadata.title,
  description: HOMEPAGE_CONTENT.en.metadata.description,
  keywords: HOMEPAGE_CONTENT.en.metadata.keywords,
  alternates: {
    canonical: buildSeoUrl(''),
    languages: buildAlternates(),
  },
  openGraph: {
    title: HOMEPAGE_CONTENT.en.metadata.title,
    description: HOMEPAGE_CONTENT.en.metadata.description,
    url: buildSeoUrl(''),
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function Home() {
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
        url: 'https://voicica.ai',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: HOMEPAGE_CONTENT.en.jsonLdFeatureList,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHero />
      <HomepageContent locale="en" />
    </div>
  );
}
