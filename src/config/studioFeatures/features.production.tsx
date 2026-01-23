/**
 * Studio 首页功能入口配置 - 生产环境
 *
 * 生产环境只显示已上线的功能
 */

import { Mic, Music, Video, FileText, Wand2, Download, Zap } from 'lucide-react';
import type { StudioFeatureItem } from './types';

export const studioFeatureItems: StudioFeatureItem[] = [
  {
    id: 'ai-music',
    name: 'AI Music',
    icon: <Music className="w-6 h-6" />,
    href: '/studio/ai-music',
    gradient: 'from-pink-500 to-rose-500',
    enabled: true,
  },
  {
    id: 'ai-song',
    name: 'AI Song One-Click',
    icon: <Zap className="w-6 h-6" />,
    href: '/studio/ai-song',
    gradient: 'from-amber-500 to-orange-500',
    enabled: true,
  },
  {
    id: 'ai-cover',
    name: 'AI Cover',
    icon: <Wand2 className="w-6 h-6" />,
    href: '/studio/ai-cover',
    gradient: 'from-orange-500 to-pink-500',
    enabled: false, // 生产环境暂未上线
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    icon: <Mic className="w-6 h-6" />,
    href: '/studio/tts',
    gradient: 'from-purple-500 to-purple-600',
    enabled: true,
  },
  {
    id: 'story',
    name: 'Story Maker',
    icon: <FileText className="w-6 h-6" />,
    href: '/studio/story/generate',
    gradient: 'from-blue-500 to-cyan-500',
    enabled: false, // 生产环境暂未上线
  },
  {
    id: 'tiktok',
    name: 'TikTok Download',
    icon: <Download className="w-6 h-6" />,
    href: '/studio/tools/tiktok-downloader',
    gradient: 'from-gray-700 to-gray-800',
    enabled: false, // 生产环境暂未上线
  },
  {
    id: 'youtube',
    name: 'YouTube Download',
    icon: <Video className="w-6 h-6" />,
    href: '/studio/tools/youtube-downloader',
    gradient: 'from-red-500 to-red-600',
    enabled: false, // 生产环境暂未上线
  },
];
