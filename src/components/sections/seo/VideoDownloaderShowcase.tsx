'use client';

import Link from 'next/link';
import { Search, Download, Film, Music, Video } from 'lucide-react';
import {
  PLATFORMS,
  SHOWCASE_LABELS,
  type PlatformInfo,
} from '@/config/seo/video-downloader-showcase';

const featureIcons: Record<string, React.ReactNode> = {
  '4K Video': <Video className="h-3 w-3" />,
  Video: <Video className="h-3 w-3" />,
  HD: <Video className="h-3 w-3" />,
  Audio: <Music className="h-3 w-3" />,
  Shorts: <Film className="h-3 w-3" />,
  Reels: <Film className="h-3 w-3" />,
  Stories: <Film className="h-3 w-3" />,
  GIF: <Film className="h-3 w-3" />,
  'No Watermark': <Download className="h-3 w-3" />,
};

function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18">
      <rect width="24" height="18" rx="4" fill="#FF0000" />
      <path d="M9.5 4.5L16.5 9L9.5 13.5V4.5Z" fill="white" />
    </svg>
  );
}

function TikTokLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05c-3.56 0-6.45 2.89-6.45 6.45s2.89 6.45 6.45 6.45 6.45-2.89 6.45-6.45V8.98a8.32 8.32 0 004.87 1.56V7.09a4.84 4.84 0 01-1.22-.4z" />
    </svg>
  );
}

function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="url(#igGradSeo)"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="5" stroke="url(#igGradSeo)" strokeWidth="2" />
      <circle cx="18" cy="6" r="1.5" fill="url(#igGradSeo)" />
      <defs>
        <linearGradient id="igGradSeo" x1="2" y1="22" x2="22" y2="2">
          <stop stopColor="#F58529" />
          <stop offset="0.5" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#8134AF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const platformLogos: Record<string, React.ReactNode> = {
  youtube: <YouTubeLogo className="h-6 w-6" />,
  tiktok: <TikTokLogo className="h-5 w-5 text-white" />,
  instagram: <InstagramLogo className="h-5 w-5" />,
  x: <XLogo className="h-4 w-4 text-white" />,
  facebook: <FacebookLogo className="h-5 w-5" />,
};

function PlatformCard({ platform }: { platform: PlatformInfo }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors hover:bg-white/5 ${platform.bgColor}`}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
          {platformLogos[platform.id]}
        </div>
        <p className={`text-sm font-semibold ${platform.color}`}>
          {platform.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {platform.features.map((feature) => (
          <span
            key={feature}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-gray-400"
          >
            {featureIcons[feature]}
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function VideoDownloaderShowcase({
  locale,
}: {
  locale: string;
}) {
  const labels = SHOWCASE_LABELS[locale] || SHOWCASE_LABELS.en;

  return (
    <section className="px-6 py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Search box */}
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-center text-lg font-semibold text-white">
            {labels.title}
          </p>
          <Link
            href="/native"
            className="group flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/60 px-4 py-3 transition-colors hover:border-gray-600 hover:bg-gray-800"
          >
            <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <span className="flex-1 text-sm text-gray-500">
              {labels.placeholder}
            </span>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white transition-opacity group-hover:opacity-90">
              {labels.button}
            </span>
          </Link>
        </div>

        {/* Platform cards */}
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium text-gray-400">
            {labels.supported}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PLATFORMS.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
