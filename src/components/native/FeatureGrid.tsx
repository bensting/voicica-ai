'use client';

import Link from 'next/link';

// 图标组件
const VideoIcon = () => (
  <svg
    className="w-6 h-6"
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
    className="w-6 h-6"
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
    className="w-6 h-6"
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
    className="w-6 h-6"
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

const TTSIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
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
    id: 'tts',
    name: 'AI TTS',
    icon: <TTSIcon />,
    href: '/native/create/voice',
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
 * 功能入口网格
 * AI Video / AI Music / AI TTS / AI Effect / AI Image
 */
export default function FeatureGrid() {
  return (
    <div className="px-4 py-5">
      <div className="grid grid-cols-5 gap-2">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="flex flex-col items-center justify-center aspect-square bg-gray-800/60 rounded-xl hover:bg-gray-700/60 transition-colors"
          >
            <div className="text-gray-300 mb-1.5">{feature.icon}</div>
            <span className="text-[10px] text-gray-300 font-medium">
              {feature.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
