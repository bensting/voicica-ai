import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiVoicePageContent from '@/components/sections/seo/AiVoicePageContent';
import {
  getSeoLocaleBySlug,
  buildSeoUrl,
  buildAlternates,
} from '@/config/seo/locales';
import { AI_VOICE_CONTENT } from '@/config/seo/ai-voice';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) return {};

  const content = AI_VOICE_CONTENT[loc.localeCode] || AI_VOICE_CONTENT.en;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    keywords: content.metadata.keywords,
    alternates: {
      canonical: buildSeoUrl(slug, 'ai-voice'),
      languages: buildAlternates('ai-voice'),
    },
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      url: buildSeoUrl(slug, 'ai-voice'),
      siteName: 'Voicica AI',
      locale: loc.ogLocale,
      type: 'website',
    },
  };
}

export default async function LocaleAiVoicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) notFound();

  return <AiVoicePageContent locale={loc.localeCode} />;
}
