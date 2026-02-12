'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, User, UserRound, MessageSquare } from 'lucide-react';
import {
  VOICE_SAMPLES,
  DIALOGUE_SAMPLES,
  SHOWCASE_LABELS,
  type VoiceSample,
  type DialogueSample,
} from '@/config/seo/ai-voice-showcase';

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  JP: '🇯🇵',
  KR: '🇰🇷',
  TH: '🇹🇭',
  TW: '🇹🇼',
  CN: '🇨🇳',
};

const gradients = [
  'from-purple-500 to-pink-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function VoiceCard({
  voice,
  index,
  playingId,
  onPlay,
}: {
  voice: VoiceSample;
  index: number;
  playingId: string | null;
  onPlay: (id: string, url: string) => void;
}) {
  const isPlaying = playingId === voice.id;
  const gradient = gradients[index % gradients.length];

  return (
    <div
      onClick={() => onPlay(voice.id, voice.audioUrl)}
      className="group cursor-pointer rounded-xl border border-gray-700/50 bg-gray-800/50 p-3 transition-all hover:border-gray-600/50 hover:bg-gray-800/80 active:scale-[0.98]"
    >
      <div className="mb-2 flex items-center gap-2.5">
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
          {voice.avatarUrl ? (
            <Image
              src={voice.avatarUrl}
              alt={voice.displayName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
            >
              <User className="h-4 w-4 text-white/80" />
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {voice.displayName}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
            {voice.country && (
              <span>{countryFlags[voice.country] || voice.country}</span>
            )}
            {voice.gender === 'male' ? (
              <User className="h-3 w-3 text-blue-400" />
            ) : (
              <UserRound className="h-3 w-3 text-pink-400" />
            )}
            <span className="truncate text-gray-500">{voice.provider}</span>
          </div>
        </div>

        {/* Play button */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
            isPlaying
              ? 'bg-purple-500/30 text-purple-400'
              : 'bg-white/10 text-white/70 group-hover:bg-white/15'
          }`}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" />
          )}
        </div>
      </div>

      {/* Text preview */}
      <p className="truncate text-xs text-gray-400">{voice.text}</p>
    </div>
  );
}

function DialogueCard({
  dialogue,
  index,
  playingId,
  onPlay,
}: {
  dialogue: DialogueSample;
  index: number;
  playingId: string | null;
  onPlay: (id: string, url: string) => void;
}) {
  const isPlaying = playingId === dialogue.id;
  const gradient = gradients[(index + 2) % gradients.length];

  return (
    <div
      onClick={() => onPlay(dialogue.id, dialogue.audioUrl)}
      className="group cursor-pointer rounded-xl border border-gray-700/50 bg-gray-800/50 p-3 transition-all hover:border-gray-600/50 hover:bg-gray-800/80 active:scale-[0.98]"
    >
      <div className="mb-2 flex items-center gap-2.5">
        {/* Dialogue icon */}
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}
        >
          <MessageSquare className="h-4 w-4 text-white/80" />
        </div>

        {/* Speakers + duration */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {dialogue.speakers.join(' & ')}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDuration(dialogue.duration)}
          </p>
        </div>

        {/* Play button */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
            isPlaying
              ? 'bg-purple-500/30 text-purple-400'
              : 'bg-white/10 text-white/70 group-hover:bg-white/15'
          }`}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" />
          )}
        </div>
      </div>

      {/* Preview text */}
      <p className="truncate text-xs text-gray-400">
        {dialogue.previewText}
      </p>
    </div>
  );
}

export default function VoiceShowcase({ locale }: { locale: string }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels = SHOWCASE_LABELS[locale] || SHOWCASE_LABELS.en;

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
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Voice Samples */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {labels.voices}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VOICE_SAMPLES.map((voice, i) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                index={i}
                playingId={playingId}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </div>

        {/* Dialogue Samples */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {labels.dialogues}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DIALOGUE_SAMPLES.map((dialogue, i) => (
              <DialogueCard
                key={dialogue.id}
                dialogue={dialogue}
                index={i}
                playingId={playingId}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
