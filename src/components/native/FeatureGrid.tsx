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

const DialogueIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round" />
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
    name: 'Text to Voice',
    icon: <TTSIcon />,
    href: '/native/create/voice',
  },
  {
    id: 'dialogue',
    name: 'Text to Dialogue',
    icon: <DialogueIcon />,
    href: '/native/create/dialogue',
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
    <div className="py-5">
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="flex flex-col items-center justify-center w-[72px] h-[72px] flex-shrink-0 bg-gray-800/60 rounded-xl hover:bg-gray-700/60 transition-colors"
          >
            <div className="text-gray-300 mb-1.5">{feature.icon}</div>
            <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">
              {feature.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
