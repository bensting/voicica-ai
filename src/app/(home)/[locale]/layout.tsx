import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  SEO_LOCALES,
  getSeoLocaleBySlug,
  buildSeoUrl,
  buildAlternates,
} from '@/config/seo/locales';
import { HOMEPAGE_CONTENT } from '@/config/seo/homepage';

export function generateStaticParams() {
  return SEO_LOCALES.map((l) => ({ locale: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) return {};

  const content = HOMEPAGE_CONTENT[loc.localeCode] || HOMEPAGE_CONTENT.en;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    keywords: content.metadata.keywords,
    alternates: {
      canonical: buildSeoUrl(slug),
      languages: buildAlternates(),
    },
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      url: buildSeoUrl(slug),
      siteName: 'Voicica AI',
      locale: loc.ogLocale,
      type: 'website',
    },
  };
}

export default async function LocaleHomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) notFound();

  const content = HOMEPAGE_CONTENT[loc.localeCode] || HOMEPAGE_CONTENT.en;

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
        url: buildSeoUrl(slug),
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        inLanguage: loc.htmlLang,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: content.jsonLdFeatureList,
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
