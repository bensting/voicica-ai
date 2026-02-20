export interface SeoLocale {
  slug: string; // URL slug: '' for English, 'ja', 'tw', 'ko', 'th'
  localeCode: string; // Internal code: 'en', 'ja', 'zh-Hant', 'ko', 'th'
  htmlLang: string; // <html lang="">: 'en', 'ja', 'zh-Hant', 'ko', 'th'
  ogLocale: string; // OpenGraph locale: 'en_US', 'ja_JP', etc.
  nativeName: string; // Native name: 'English', '日本語', etc.
  hreflang: string; // hreflang tag: 'en', 'ja', 'zh-Hant', 'ko', 'th'
}

export const ENGLISH_LOCALE: SeoLocale = {
  slug: '',
  localeCode: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  nativeName: 'English',
  hreflang: 'en',
};

export const SEO_LOCALES: SeoLocale[] = [
  {
    slug: 'ja',
    localeCode: 'ja',
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    nativeName: '日本語',
    hreflang: 'ja',
  },
  {
    slug: 'tw',
    localeCode: 'zh-Hant',
    htmlLang: 'zh-Hant',
    ogLocale: 'zh_TW',
    nativeName: '繁體中文',
    hreflang: 'zh-Hant',
  },
  {
    slug: 'ko',
    localeCode: 'ko',
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    nativeName: '한국어',
    hreflang: 'ko',
  },
  {
    slug: 'th',
    localeCode: 'th',
    htmlLang: 'th',
    ogLocale: 'th_TH',
    nativeName: 'ภาษาไทย',
    hreflang: 'th',
  },
];

export const ALL_SEO_LOCALES: SeoLocale[] = [ENGLISH_LOCALE, ...SEO_LOCALES];

const BASE_URL = 'https://voicica.ai';

export function getSeoLocaleBySlug(slug: string): SeoLocale | undefined {
  if (!slug) return ENGLISH_LOCALE;
  return SEO_LOCALES.find((l) => l.slug === slug);
}

export function buildSeoUrl(slug: string, path: string = ''): string {
  const prefix = slug ? `/${slug}` : '';
  const suffix = path ? `/${path}` : '';
  return `${BASE_URL}${prefix}${suffix}`;
}

export function buildAlternates(
  path: string = '',
): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of ALL_SEO_LOCALES) {
    alternates[locale.hreflang] = buildSeoUrl(locale.slug, path);
  }
  alternates['x-default'] = buildSeoUrl('', path);
  return alternates;
}
