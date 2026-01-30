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
  {
    labelKey: 'footer.info.refund',
    href: '/refund',
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
  {
    labelKey: 'footer.products.aiMusic',
    href: '/studio/ai-song',
  },
  {
    labelKey: 'footer.products.aiVideo',
    href: '/studio/ai-video/text-to-video',
  },
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