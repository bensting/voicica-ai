import type { Metadata } from 'next';
import VideoDownloaderPageContent from '@/components/sections/seo/VideoDownloaderPageContent';
import { buildSeoUrl, buildAlternates } from '@/config/seo/locales';
import { VIDEO_DOWNLOADER_CONTENT } from '@/config/seo/video-downloader';

export const metadata: Metadata = {
  title: VIDEO_DOWNLOADER_CONTENT.en.metadata.title,
  description: VIDEO_DOWNLOADER_CONTENT.en.metadata.description,
  keywords: VIDEO_DOWNLOADER_CONTENT.en.metadata.keywords,
  alternates: {
    canonical: buildSeoUrl('', 'video-downloader'),
    languages: buildAlternates('video-downloader'),
  },
  openGraph: {
    title: VIDEO_DOWNLOADER_CONTENT.en.metadata.title,
    description: VIDEO_DOWNLOADER_CONTENT.en.metadata.description,
    url: buildSeoUrl('', 'video-downloader'),
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function VideoDownloaderPage() {
  return <VideoDownloaderPageContent locale="en" />;
}
