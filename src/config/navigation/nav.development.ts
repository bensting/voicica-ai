/**
 * Navigation configuration for development environment
 */

import TikTokIcon from '@/components/icons/TikTokIcon';
import YouTubeIcon from '@/components/icons/YouTubeIcon';
import TTSIcon from '@/components/icons/TTSIcon';
import type { NavigationConfig } from './types';

export const navigationConfig: NavigationConfig = {
  links: [
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
      id: 'studio',
      labelKey: 'nav.studio',
      items: [
        {
          href: '/tts',
          labelKey: 'nav.textToSpeech',
          descriptionKey: 'nav.textToSpeechDesc',
          icon: TTSIcon,
        },
      ],
    },
    {
      id: 'free-tools',
      labelKey: 'nav.freeTools',
      insertAfter: 'studio', // Insert after Studio dropdown
      items: [
        {
          href: '/studio/tools/tiktok-downloader',
          labelKey: 'nav.tiktokDownloader',
          descriptionKey: 'nav.tiktokDownloaderDesc',
          icon: TikTokIcon,
        },
        {
          href: '/studio/tools/youtube-downloader',
          labelKey: 'nav.youtubeDownloader',
          descriptionKey: 'nav.youtubeDownloaderDesc',
          icon: YouTubeIcon,
        },
      ],
    },
  ],
};