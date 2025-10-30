import VoiceCard from './VoiceCard';
import type { Voice } from '@/types/voice';

interface VoiceListProps {
  voices: Voice[];
  loading: boolean;
  error: string | null;
  playingVoiceId: string | null;
  locale: string;
  getVoiceName: (voice: Voice) => string;
  onPlayVoice: (voice: Voice) => void;
  onSelectVoice: (voice: Voice) => void;
}

/**
 * Voice list component with loading, error, and empty states
 */
export default function VoiceList({
  voices,
  loading,
  error,
  playingVoiceId,
  getVoiceName,
  onPlayVoice,
  onSelectVoice,
}: VoiceListProps) {
  // Loading state - Show skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 animate-pulse"
          >
            {/* Avatar skeleton */}
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>

            {/* Button skeleton */}
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  // Empty state
  if (voices.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-gray-500">No voices found</div>
      </div>
    );
  }

  // Voice cards
  return (
    <div className="space-y-3">
      {voices.map((voice) => (
        <VoiceCard
          key={voice.id}
          voice={voice}
          voiceName={getVoiceName(voice)}
          isPlaying={playingVoiceId === voice.id}
          onPlay={onPlayVoice}
          onSelect={onSelectVoice}
        />
      ))}
    </div>
  );
}