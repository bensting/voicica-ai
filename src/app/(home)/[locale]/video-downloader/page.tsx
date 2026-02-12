import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VideoDownloaderPageContent from '@/components/sections/seo/VideoDownloaderPageContent';
import {
  getSeoLocaleBySlug,
  buildSeoUrl,
  buildAlternates,
} from '@/config/seo/locales';
import { VIDEO_DOWNLOADER_CONTENT } from '@/config/seo/video-downloader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) return {};

  const content =
    VIDEO_DOWNLOADER_CONTENT[loc.localeCode] || VIDEO_DOWNLOADER_CONTENT.en;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    keywords: content.metadata.keywords,
    alternates: {
      canonical: buildSeoUrl(slug, 'video-downloader'),
      languages: buildAlternates('video-downloader'),
    },
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      url: buildSeoUrl(slug, 'video-downloader'),
      siteName: 'Voicica AI',
      locale: loc.ogLocale,
      type: 'website',
    },
  };
}

export default async function LocaleVideoDownloaderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) notFound();

  return <VideoDownloaderPageContent locale={loc.localeCode} />;
}
