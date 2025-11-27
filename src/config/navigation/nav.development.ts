/**
 * Navigation configuration for development environment
 */

import { Download } from 'lucide-react';
import type { NavigationConfig } from './types';

export const navigationConfig: NavigationConfig = {
  links: [
    {
      href: '/studio/tts',
      labelKey: 'nav.studio',
      type: 'page',
    },
    {
      href: '/pricing',
      labelKey: 'nav.pricing',
      type: 'section',
      sectionId: 'pricing',
    },
    {
      href: '/#faq',
      labelKey: 'nav.faq',
      type: 'section',
      sectionId: 'faq',
    },
  ],
  dropdowns: [
    {
      id: 'free-tools',
      labelKey: 'nav.freeTools',
      items: [
        {
          href: '/studio/tiktok-downloader',
          labelKey: 'nav.tiktokDownloader',
          descriptionKey: 'nav.tiktokDownloaderDesc',
          icon: Download,
        },
      ],
    },
  ],
};