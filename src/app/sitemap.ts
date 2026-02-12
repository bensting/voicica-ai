import { MetadataRoute } from 'next';
import { ALL_SEO_LOCALES, buildSeoUrl } from '@/config/seo/locales';

const PAGES = [
  { path: '', priority: 1.0, changeFrequency: 'daily' as const },
  { path: 'ai-voice', priority: 0.8, changeFrequency: 'weekly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    for (const locale of ALL_SEO_LOCALES) {
      const alternates: Record<string, string> = {};
      for (const alt of ALL_SEO_LOCALES) {
        alternates[alt.hreflang] = buildSeoUrl(alt.slug, page.path);
      }

      entries.push({
        url: buildSeoUrl(locale.slug, page.path),
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}
