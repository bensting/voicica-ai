import { AI_IMAGE_CONTENT } from '@/config/seo/ai-image';
import ImageShowcase from './ImageShowcase';
import SeoCta from './SeoCta';

interface AiImagePageContentProps {
  locale: string;
}

export default function AiImagePageContent({ locale }: AiImagePageContentProps) {
  const content = AI_IMAGE_CONTENT[locale] || AI_IMAGE_CONTENT.en;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="px-6 pb-6 pt-24 md:pb-8 md:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
            {content.hero.title}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-400 md:text-lg">
            {content.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Image Showcase */}
      <ImageShowcase locale={locale} />

      {/* CTA */}
      <section className="px-6 py-10 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            {content.cta.title}
          </h2>
          <SeoCta buttonText={content.cta.buttonText} />
        </div>
      </section>

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
