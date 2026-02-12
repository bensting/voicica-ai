'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import { SEO_LOCALES, ENGLISH_LOCALE, ALL_SEO_LOCALES, type SeoLocale } from '@/config/seo/locales';
import { SEO_NAV_LINKS, SEO_NAV_LABELS, SEO_LANGUAGE_LABEL } from '@/config/seo/navbar';
import { NavbarDownloadButton } from './SeoAppBadges';

function detectLocale(pathname: string): SeoLocale {
  for (const loc of SEO_LOCALES) {
    if (pathname === `/${loc.slug}` || pathname.startsWith(`/${loc.slug}/`)) {
      return loc;
    }
  }
  return ENGLISH_LOCALE;
}

function getPagePath(pathname: string, localeSlug: string): string {
  if (!localeSlug) return pathname === '/' ? '' : pathname.slice(1);
  const prefix = `/${localeSlug}`;
  if (pathname === prefix) return '';
  return pathname.slice(prefix.length + 1);
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

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const getLabel = (id: string) =>
    SEO_NAV_LABELS[id]?.[currentLocale.localeCode] ||
    SEO_NAV_LABELS[id]?.en ||
    id;

  const langLabel =
    SEO_LANGUAGE_LABEL[currentLocale.localeCode] || SEO_LANGUAGE_LABEL.en;

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-gray-950/80 shadow-lg shadow-black/20 backdrop-blur-xl'
            : 'bg-gradient-to-b from-black/60 to-transparent'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link
              href={buildHref(currentLocale.slug, '')}
              className="flex items-center gap-2"
            >
              <Image
                src="/logo/logo-transparent-256.webp"
                alt="Voicica AI"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="text-sm font-bold text-white">Voicica AI</span>
            </Link>
          </div>

          {/* Center: product links (desktop) */}
          <div className="hidden items-center gap-1 lg:flex">
            {SEO_NAV_LINKS.map((link) => {
              const href = buildHref(currentLocale.slug, link.path);
              const isActive = pagePath === link.path;
              return (
                <Link
                  key={link.id}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {getLabel(link.id)}
                </Link>
              );
            })}
          </div>

          {/* Right: download + language switcher (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            <NavbarDownloadButton />
            <Popover className="relative">
              <PopoverButton className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none">
                <Globe className="h-4 w-4" />
                <span>{currentLocale.nativeName}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </PopoverButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <PopoverPanel className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-xl border border-white/10 bg-gray-900/95 p-1 shadow-xl backdrop-blur-xl">
                  {ALL_SEO_LOCALES.map((loc) => {
                    const href = buildHref(loc.slug, pagePath);
                    const isCurrent = loc.localeCode === currentLocale.localeCode;
                    return (
                      <Link
                        key={loc.localeCode}
                        href={href}
                        className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-white/10 font-semibold text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {loc.nativeName}
                      </Link>
                    );
                  })}
                </PopoverPanel>
              </Transition>
            </Popover>
          </div>

          {/* Mobile language button (compact) */}
          <div className="lg:hidden">
            <Popover className="relative">
              <PopoverButton className="flex items-center gap-1 rounded-full px-2 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none">
                <Globe className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </PopoverButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <PopoverPanel className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl border border-white/10 bg-gray-900/95 p-1 shadow-xl backdrop-blur-xl">
                  {ALL_SEO_LOCALES.map((loc) => {
                    const href = buildHref(loc.slug, pagePath);
                    const isCurrent = loc.localeCode === currentLocale.localeCode;
                    return (
                      <Link
                        key={loc.localeCode}
                        href={href}
                        className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-white/10 font-semibold text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {loc.nativeName}
                      </Link>
                    );
                  })}
                </PopoverPanel>
              </Transition>
            </Popover>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <Transition
        show={mobileOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className="fixed inset-x-0 top-14 z-40 border-b border-white/10 bg-gray-950/95 backdrop-blur-xl sm:top-16 lg:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-2 sm:px-6">
            <div className="flex flex-col gap-1">
              {SEO_NAV_LINKS.map((link) => {
                const href = buildHref(currentLocale.slug, link.path);
                const isActive = pagePath === link.path;
                return (
                  <Link
                    key={link.id}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {getLabel(link.id)}
                  </Link>
                );
              })}
            </div>

            {/* Download button in mobile */}
            <div className="mt-3 border-t border-white/10 pt-3">
              <a
                href="https://play.google.com/store/apps/details?id=ai.voicica.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z"/>
                  <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z"/>
                  <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z"/>
                  <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z"/>
                </svg>
                Download on Google Play
              </a>
            </div>

            {/* Language section in mobile */}
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                {langLabel}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {ALL_SEO_LOCALES.map((loc) => {
                  const href = buildHref(loc.slug, pagePath);
                  const isCurrent = loc.localeCode === currentLocale.localeCode;
                  return (
                    <Link
                      key={loc.localeCode}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-white/10 font-semibold text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {loc.nativeName}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Backdrop for mobile menu */}
      <Transition
        show={mobileOpen}
        as={Fragment}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      </Transition>
    </>
  );
}
