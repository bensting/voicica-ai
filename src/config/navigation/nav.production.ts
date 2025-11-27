/**
 * Navigation configuration for production environment
 */

import TikTokIcon from '@/components/icons/TikTokIcon';
import YouTubeIcon from '@/components/icons/YouTubeIcon';
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
      insertAfter: '/studio/tts', // Insert after Studio link
      items: [
        {
          href: '/studio/tiktok-downloader',
          labelKey: 'nav.tiktokDownloader',
          descriptionKey: 'nav.tiktokDownloaderDesc',
          icon: TikTokIcon,
        },
        {
          href: '/studio/youtube-downloader',
          labelKey: 'nav.youtubeDownloader',
          descriptionKey: 'nav.youtubeDownloaderDesc',
          icon: YouTubeIcon,
        },
      ],
    },
  ],
};