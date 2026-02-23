import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MiningPageContent from '@/app/(home)/mining/MiningPageContent';
import {
  getSeoLocaleBySlug,
  buildSeoUrl,
  buildAlternates,
} from '@/config/seo/locales';
import { MINING_CONTENT } from '@/config/seo/mining';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) return {};

  const content = MINING_CONTENT[loc.localeCode] || MINING_CONTENT.en;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    keywords: content.metadata.keywords,
    alternates: {
      canonical: buildSeoUrl(slug, 'mining'),
      languages: buildAlternates('mining'),
    },
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      url: buildSeoUrl(slug, 'mining'),
      siteName: 'Voicica AI',
      locale: loc.ogLocale,
      type: 'website',
    },
  };
}

export default async function LocaleMiningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) notFound();

  const content = MINING_CONTENT[loc.localeCode] || MINING_CONTENT.en;

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
            item: buildSeoUrl(slug),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Mining',
            item: buildSeoUrl(slug, 'mining'),
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Voicica Pro — AI Mining',
        url: buildSeoUrl(slug, 'mining'),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Android',
        inLanguage: loc.htmlLang,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: content.steps.map((s) => s.title),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MiningPageContent locale={loc.localeCode} />
    </>
  );
}
