import { MetadataRoute } from 'next';
import { ALL_SEO_LOCALES, buildSeoUrl } from '@/config/seo/locales';

// SEO pages with locale variants (en + ja/tw/ko/th)
const SEO_PAGES = [
  { path: '', priority: 1.0, changeFrequency: 'daily' as const },
  { path: 'ai-voice', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'ai-music', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'ai-image', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'ai-video', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'image-tools', priority: 0.8, changeFrequency: 'weekly' as const },
  {
    path: 'video-downloader',
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  },
];

// Standalone pages (English only, no locale variants)
const STANDALONE_PAGES = [
  { path: 'pricing', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: 'about', priority: 0.3, changeFrequency: 'monthly' as const },
  { path: 'privacy', priority: 0.2, changeFrequency: 'monthly' as const },
  { path: 'terms', priority: 0.2, changeFrequency: 'monthly' as const },
  { path: 'refund', priority: 0.2, changeFrequency: 'monthly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // SEO pages with locale variants and hreflang alternates
  for (const page of SEO_PAGES) {
    const alternates: Record<string, string> = {};
    for (const alt of ALL_SEO_LOCALES) {
      alternates[alt.hreflang] = buildSeoUrl(alt.slug, page.path);
    }
    alternates['x-default'] = buildSeoUrl('', page.path);

    for (const locale of ALL_SEO_LOCALES) {
      entries.push({
        url: buildSeoUrl(locale.slug, page.path),
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: alternates },
      });
    }
  }

  // Standalone pages (no locale variants)
  for (const page of STANDALONE_PAGES) {
    entries.push({
      url: `https://voicica.ai/${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  return entries;
}
