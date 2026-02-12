import type { Metadata } from 'next';
import AiVoicePageContent from '@/components/sections/seo/AiVoicePageContent';
import { buildSeoUrl, buildAlternates } from '@/config/seo/locales';
import { AI_VOICE_CONTENT } from '@/config/seo/ai-voice';

export const metadata: Metadata = {
  title: AI_VOICE_CONTENT.en.metadata.title,
  description: AI_VOICE_CONTENT.en.metadata.description,
  keywords: AI_VOICE_CONTENT.en.metadata.keywords,
  alternates: {
    canonical: buildSeoUrl('', 'ai-voice'),
    languages: buildAlternates('ai-voice'),
  },
  openGraph: {
    title: AI_VOICE_CONTENT.en.metadata.title,
    description: AI_VOICE_CONTENT.en.metadata.description,
    url: buildSeoUrl('', 'ai-voice'),
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function AiVoicePage() {
  return <AiVoicePageContent locale="en" />;
}
