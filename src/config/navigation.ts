/**
 * Navigation configuration
 * Centralized navigation links and routing configuration
 */

export interface NavLink {
  href: string;
  labelKey: string; // i18n key for translation
  type?: 'page' | 'section'; // 'page' for route navigation, 'section' for scroll to section
  sectionId?: string; // section id for scroll behavior (only when type is 'section')
  openInNewWindow?: boolean; // if true, opens link in a new window/tab
}

/**
 * Main navigation links
 * These appear in the header navigation bar
 */
export const NAV_LINKS: NavLink[] = [
  {
    href: '/studio/tts',
    labelKey: 'nav.studio',
    type: 'page',
    // openInNewWindow 已移除 - 现在在当前页面跳转
  },
  {
    href: '/pricing',
    labelKey: 'nav.pricing',
    type: 'section', // Can scroll to section on homepage if exists, otherwise navigates to page
    sectionId: 'pricing',
  },
  {
    href: '/#faq',
    labelKey: 'nav.faq',
    type: 'section',
    sectionId: 'faq',
  },
];

