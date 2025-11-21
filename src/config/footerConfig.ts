/**
 * Footer Configuration
 *
 * Centralized configuration for all footer links
 */

export interface FooterLink {
  labelKey: string;
  href: string;
}

export interface FooterSection {
  titleKey: string;
  links: FooterLink[];
}

// Info Section Links
export const INFO_LINKS: FooterLink[] = [
  {
    labelKey: 'footer.info.terms',
    href: '/terms',
  },
  {
    labelKey: 'footer.info.privacy',
    href: '/privacy',
  },
];

// About Section Links
export const ABOUT_LINKS: FooterLink[] = [
  {
    labelKey: 'footer.about.aboutUs',
    href: '/about',
  },
  {
    labelKey: 'footer.about.faqs',
    href: '/#faq',
  },
  // {
  //   labelKey: 'footer.about.blogs',
  //   href: '/blog',
  // },
  // {
  //   labelKey: 'footer.about.dmca',
  //   href: '/dmca',
  // },
];

// Star Products Section Links
export const PRODUCTS_LINKS: FooterLink[] = [
  {
    labelKey: 'footer.products.tts',
    href: '/studio/tts',
  },
  // {
  //   labelKey: 'footer.products.songCover',
  //   href: '/studio/song-cover',
  // },
  // {
  //   labelKey: 'footer.products.musicGenerator',
  //   href: '/studio/music-generator',
  // },
  // {
  //   labelKey: 'footer.products.voiceCloning',
  //   href: '/studio/voice-cloning',
  // },
  // {
  //   labelKey: 'footer.products.voiceChanger',
  //   href: '/studio/voice-changer',
  // },
  // {
  //   labelKey: 'footer.products.api',
  //   href: '/api',
  // },
];

// All Footer Sections
export const FOOTER_SECTIONS: FooterSection[] = [
  {
    titleKey: 'footer.info.title',
    links: INFO_LINKS,
  },
  {
    titleKey: 'footer.about.title',
    links: ABOUT_LINKS,
  },
  {
    titleKey: 'footer.products.title',
    links: PRODUCTS_LINKS,
  },
];