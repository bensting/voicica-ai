/**
 * Mobile Bottom Navigation 配置 - 开发环境
 *
 * 开发环境显示所有功能，包括未上线的功能
 */

import { Mic, Users, Copy, History } from 'lucide-react';
import type { MobileNavItemConfig } from './types';

export const mobileBottomNavItems: MobileNavItemConfig[] = [
  {
    id: 'tts',
    icon: <Mic className="w-5 h-5" />,
    labelKey: 'studio.mobileNav.tts',
    href: '/studio/tts',
    enabled: true,
  },
  {
    id: 'voices',
    icon: <Users className="w-5 h-5" />,
    labelKey: 'studio.mobileNav.voices',
    href: '/studio/voices',
    enabled: true,
  },
  {
    id: 'clone',
    icon: <Copy className="w-5 h-5" />,
    labelKey: 'studio.mobileNav.clone',
    href: '/studio/clone',
    enabled: true,
  },
  {
    id: 'history',
    icon: <History className="w-5 h-5" />,
    labelKey: 'studio.mobileNav.history',
    href: '/studio/generation-history',
    enabled: true,
  },
];
