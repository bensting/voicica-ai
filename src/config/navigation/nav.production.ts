/**
 * Navigation configuration for production environment
 */

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
          href: '/native/tools/video-downloader',
          labelKey: 'nav.videoDownloader',
          descriptionKey: 'nav.videoDownloaderDesc',
          icon: TTSIcon,
        },
      ],
    },
  ],
};