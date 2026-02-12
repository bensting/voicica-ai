'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Music } from 'lucide-react';
import {
  MUSIC_SAMPLES,
  MUSIC_SHOWCASE_LABELS,
  type MusicSample,
} from '@/config/seo/ai-music-showcase';

const gradients = [
  'from-purple-600 to-pink-500',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-red-500',
  'from-emerald-500 to-cyan-500',
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function MusicCard({
  music,
  index,
  playingId,
  onPlay,
}: {
  music: MusicSample;
  index: number;
  playingId: string | null;
  onPlay: (id: string, url: string) => void;
}) {
  const isPlaying = playingId === music.id;
  const gradient = gradients[index % gradients.length];

  return (
    <div
      onClick={() => onPlay(music.id, music.audioUrl)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl transition-transform active:scale-[0.98]"
    >
      {/* Cover */}
      <div className="relative aspect-square">
        {music.coverUrl ? (
          <Image
            src={music.coverUrl}
            alt={music.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="flex h-full items-center justify-center">
              <Music className="h-10 w-10 text-white/40" />
            </div>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
              isPlaying
                ? 'bg-white/30 scale-100'
                : 'bg-white/20 scale-90 group-hover:scale-100'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 text-white" />
            )}
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
          {formatDuration(music.duration)}
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="truncate text-sm font-semibold text-white">
            {music.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/60">
            {music.style}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MusicShowcase({ locale }: { locale: string }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const label = MUSIC_SHOWCASE_LABELS[locale] || MUSIC_SHOWCASE_LABELS.en;

  const handlePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(id);
  };

  return (
    <section className="px-6 py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-lg font-semibold text-white">{label}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MUSIC_SAMPLES.map((music, i) => (
            <MusicCard
              key={music.id}
              music={music}
              index={i}
              playingId={playingId}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
