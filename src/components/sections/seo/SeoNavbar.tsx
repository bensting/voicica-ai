'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SEO_LOCALES, ENGLISH_LOCALE, ALL_SEO_LOCALES } from '@/config/seo/locales';
import { SEO_NAV_LINKS, SEO_NAV_LABELS } from '@/config/seo/navbar';

function detectLocale(pathname: string) {
  for (const loc of SEO_LOCALES) {
    if (pathname === `/${loc.slug}` || pathname.startsWith(`/${loc.slug}/`)) {
      return loc;
    }
  }
  return ENGLISH_LOCALE;
}

function getPagePath(pathname: string, localeSlug: string): string {
  if (!localeSlug) {
    // English — pathname is like "/" or "/ai-voice"
    return pathname === '/' ? '' : pathname.slice(1);
  }
  // Non-English — pathname is like "/ja" or "/ja/ai-voice"
  const prefix = `/${localeSlug}`;
  if (pathname === prefix) return '';
  return pathname.slice(prefix.length + 1); // strip "/<slug>/"
}

function buildHref(localeSlug: string, pagePath: string): string {
  const prefix = localeSlug ? `/${localeSlug}` : '';
  const suffix = pagePath ? `/${pagePath}` : '';
  return `${prefix}${suffix}` || '/';
}

export default function SeoNavbar() {
  const pathname = usePathname();
  const currentLocale = detectLocale(pathname);
  const pagePath = getPagePath(pathname, currentLocale.slug);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href={buildHref(currentLocale.slug, '')} className="flex items-center gap-2">
          <Image
            src="/logo/logo-transparent-256.webp"
            alt="Voicica AI"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-sm font-bold text-white">Voicica AI</span>
        </Link>

        {/* Product links - center */}
        <div className="hidden items-center gap-6 sm:flex">
          {SEO_NAV_LINKS.map((link) => {
            const label =
              SEO_NAV_LABELS[link.id]?.[currentLocale.localeCode] ||
              SEO_NAV_LABELS[link.id]?.en ||
              link.id;
            const href = buildHref(currentLocale.slug, link.path);
            const isActive = pagePath === link.path;
            return (
              <Link
                key={link.id}
                href={href}
                className={`text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Language switcher - right */}
        <div className="flex items-center gap-1 sm:gap-2">
          {ALL_SEO_LOCALES.map((loc) => {
            const href = buildHref(loc.slug, pagePath);
            const isCurrent = loc.localeCode === currentLocale.localeCode;
            return (
              <Link
                key={loc.localeCode}
                href={href}
                className={`rounded px-1.5 py-1 text-xs transition-colors sm:px-2 ${
                  isCurrent
                    ? 'bg-white/10 font-semibold text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {loc.nativeName}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile product links */}
      <div className="flex items-center gap-4 px-4 pb-2 sm:hidden">
        {SEO_NAV_LINKS.map((link) => {
          const label =
            SEO_NAV_LABELS[link.id]?.[currentLocale.localeCode] ||
            SEO_NAV_LABELS[link.id]?.en ||
            link.id;
          const href = buildHref(currentLocale.slug, link.path);
          const isActive = pagePath === link.path;
          return (
            <Link
              key={link.id}
              href={href}
              className={`text-xs transition-colors ${
                isActive
                  ? 'font-semibold text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
