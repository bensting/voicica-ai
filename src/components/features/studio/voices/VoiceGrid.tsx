'use client';

import VoiceGridItem from './VoiceGridItem';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceGridProps {
  voices: Voice[];
  loading: boolean;
  error: string | null;
  playingVoiceId: string | null;
  selectedVoice: Voice | null;
  getVoiceName: (voice: Voice) => string;
  onPlayVoice: (voice: Voice) => void;
  onSelectVoice: (voice: Voice) => void;
  onRetry?: () => void;
  usedOnly?: boolean;
}

/**
 * Voice grid component - circular avatars in grid layout
 */
export default function VoiceGrid({
  voices,
  loading,
  error,
  playingVoiceId,
  selectedVoice,
  getVoiceName,
  onPlayVoice,
  onSelectVoice,
  onRetry,
  usedOnly = false,
}: VoiceGridProps) {
  const { t } = useLanguage();

  // Loading state - skeleton grid
  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-2 p-4">
        {[...Array(20)].map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5 p-2 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="h-3 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <div className="text-sm text-red-500">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (voices.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-gray-500">
          {usedOnly ? t('voiceFilters.noUsedVoices') : t('voiceFilters.noVoicesFound')}
        </div>
      </div>
    );
  }

  // Voice grid
  return (
    <div className="grid grid-cols-5 gap-1 p-2">
      {voices.map((voice, index) => (
        <VoiceGridItem
          key={voice.id}
          voice={voice}
          voiceName={getVoiceName(voice)}
          isPlaying={playingVoiceId === voice.id}
          isSelected={selectedVoice?.id === voice.id}
          onPlay={onPlayVoice}
          onSelect={onSelectVoice}
          priority={index < 10}
        />
      ))}
    </div>
  );
}