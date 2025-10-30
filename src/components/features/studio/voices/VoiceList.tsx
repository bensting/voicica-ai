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
  locale,
  getVoiceName,
  onPlayVoice,
  onSelectVoice,
}: VoiceListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-gray-500">Loading voices...</div>
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