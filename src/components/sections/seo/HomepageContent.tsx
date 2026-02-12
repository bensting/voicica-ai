import { HOMEPAGE_CONTENT } from '@/config/seo/homepage';

interface HomepageContentProps {
  locale: string;
}

export default function HomepageContent({ locale }: HomepageContentProps) {
  const content = HOMEPAGE_CONTENT[locale] || HOMEPAGE_CONTENT.en;

  return (
    <section className="bg-gray-950 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl space-y-12 text-gray-300">
        <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
          {content.h1}
        </h1>

        <div className="grid gap-10 md:grid-cols-2">
          {content.features.map((feature) => (
            <div key={feature.title}>
              <h2 className="mb-2 text-xl font-semibold text-white">
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
  );
}
