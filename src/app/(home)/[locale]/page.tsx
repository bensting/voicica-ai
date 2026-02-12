import { notFound } from 'next/navigation';
import { NewHero } from '@/components/sections/new-home';
import HomepageContent from '@/components/sections/seo/HomepageContent';
import { getSeoLocaleBySlug } from '@/config/seo/locales';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: slug } = await params;
  const loc = getSeoLocaleBySlug(slug);
  if (!loc) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <NewHero locale={loc.localeCode as 'en' | 'ja' | 'zh-Hant' | 'ko' | 'th'} />
      <HomepageContent locale={loc.localeCode} />
    </div>
  );
}
