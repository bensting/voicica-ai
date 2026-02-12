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
  'HD': <Video className="h-3 w-3" />,
  Audio: <Music className="h-3 w-3" />,
  Shorts: <Film className="h-3 w-3" />,
  Reels: <Film className="h-3 w-3" />,
  Stories: <Film className="h-3 w-3" />,
  GIF: <Film className="h-3 w-3" />,
  'No Watermark': <Download className="h-3 w-3" />,
};

function PlatformCard({ platform }: { platform: PlatformInfo }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors hover:bg-white/5 ${platform.bgColor}`}
    >
      <p className={`text-sm font-semibold ${platform.color}`}>
        {platform.name}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
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
