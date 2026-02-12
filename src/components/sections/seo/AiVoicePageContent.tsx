import Link from 'next/link';
import { AI_VOICE_CONTENT } from '@/config/seo/ai-voice';
import VoiceShowcase from './VoiceShowcase';

interface AiVoicePageContentProps {
  locale: string;
}

export default function AiVoicePageContent({ locale }: AiVoicePageContentProps) {
  const content = AI_VOICE_CONTENT[locale] || AI_VOICE_CONTENT.en;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="px-6 pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
            {content.hero.title}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-400 md:text-lg">
            {content.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Voice & Dialogue Showcase */}
      <VoiceShowcase locale={locale} />

      {/* Features */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {content.features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <h2 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h2>
                <p className="text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            {content.cta.title}
          </h2>
          <Link
            href="/native"
            className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {content.cta.buttonText}
          </Link>
        </div>
      </section>

      {/* SEO text */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm leading-relaxed text-gray-500">
            {content.seoText}
          </p>
        </div>
      </section>
    </div>
  );
}
