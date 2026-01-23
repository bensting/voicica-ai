'use client';

import Link from 'next/link';
import { Mic, Music, Video, FileText, Wand2, Download } from 'lucide-react';

interface FeatureItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
}

const features: FeatureItem[] = [
  {
    id: 'tts',
    name: 'Text to Speech',
    icon: <Mic className="w-6 h-6" />,
    href: '/studio/tts',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'ai-music',
    name: 'AI Music',
    icon: <Music className="w-6 h-6" />,
    href: '/studio/ai-music',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'ai-cover',
    name: 'AI Cover',
    icon: <Wand2 className="w-6 h-6" />,
    href: '/studio/ai-cover',
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    id: 'story',
    name: 'Story Maker',
    icon: <FileText className="w-6 h-6" />,
    href: '/studio/story/generate',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tiktok',
    name: 'TikTok Download',
    icon: <Download className="w-6 h-6" />,
    href: '/studio/tools/tiktok-downloader',
    gradient: 'from-gray-700 to-gray-800',
  },
  {
    id: 'youtube',
    name: 'YouTube Download',
    icon: <Video className="w-6 h-6" />,
    href: '/studio/tools/youtube-downloader',
    gradient: 'from-red-500 to-red-600',
  },
];

/**
 * Studio 功能入口网格
 * 横向滚动显示功能入口卡片
 */
export default function StudioFeatureGrid() {
  return (
    <div className="py-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="flex flex-col items-center justify-center min-w-[90px] lg:min-w-[100px] h-[90px] lg:h-[100px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
              {feature.icon}
            </div>
            <span className="text-xs text-gray-600 font-medium text-center px-1 leading-tight">
              {feature.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
