'use client';

import Link from 'next/link';

// 图标组件
const VideoIcon = () => (
  <svg
    className="w-7 h-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
  </svg>
);

const MusicIcon = () => (
  <svg
    className="w-7 h-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const EffectIcon = () => (
  <svg
    className="w-7 h-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    <path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15z" />
  </svg>
);

const ImageIcon = () => (
  <svg
    className="w-7 h-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const features = [
  {
    id: 'video',
    name: 'AI Video',
    icon: <VideoIcon />,
    href: '/native/create/video',
  },
  {
    id: 'music',
    name: 'AI Music',
    icon: <MusicIcon />,
    href: '/native/create/music',
  },
  {
    id: 'effect',
    name: 'AI Effect',
    icon: <EffectIcon />,
    href: '/native/create/effect',
  },
  {
    id: 'image',
    name: 'AI Image',
    icon: <ImageIcon />,
    href: '/native/create/image',
  },
];

/**
 * 四宫格功能入口
 * AI Video / AI Music / AI Effect / AI Image
 */
export default function FeatureGrid() {
  return (
    <div className="px-4 py-5">
      <div className="grid grid-cols-4 gap-3">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="flex flex-col items-center justify-center py-4 bg-gray-800/60 rounded-2xl hover:bg-gray-700/60 transition-colors"
          >
            <div className="text-gray-300 mb-2">{feature.icon}</div>
            <span className="text-xs text-gray-300 font-medium">
              {feature.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
