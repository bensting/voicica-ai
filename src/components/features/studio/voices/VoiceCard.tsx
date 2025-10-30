import { Play, Pause, ArrowRight } from 'lucide-react';
import type { Voice } from '@/types/voice';

interface VoiceCardProps {
  voice: Voice;
  voiceName: string;
  isPlaying: boolean;
  onPlay: (voice: Voice) => void;
  onSelect: (voice: Voice) => void;
}

/**
 * Voice card component displaying voice information and actions
 */
export default function VoiceCard({
  voice,
  voiceName,
  isPlaying,
  onPlay,
  onSelect,
}: VoiceCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Avatar + Play button */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {voice.avatar_url ? (
          <img
            src={voice.avatar_url}
            alt={voiceName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
            {voiceName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Play button overlay */}
        <button
          onClick={() => onPlay(voice)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white drop-shadow-lg" />
          ) : (
            <Play className="w-4 h-4 text-white drop-shadow-lg" />
          )}
        </button>
      </div>

      {/* Voice information */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{voiceName}</h3>
        <p className="text-xs text-orange-500 capitalize">{voice.role || 'General'}</p>
        <p className="text-xs text-gray-500">
          {voice.gender === 'male' ? 'Male' : voice.gender === 'female' ? 'Female' : 'Neutral'} | {voice.locale}
        </p>
      </div>

      {/* Select button */}
      <button
        onClick={() => onSelect(voice)}
        className="w-8 h-8 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-center flex-shrink-0 transition-colors group"
      >
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </button>
    </div>
  );
}