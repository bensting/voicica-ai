import VoiceCard from './VoiceCard';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceListProps {
  voices: Voice[];
  loading: boolean;
  error: string | null;
  playingVoiceId: string | null;
  locale: string;
  getVoiceName: (voice: Voice) => string;
  onPlayVoice: (voice: Voice) => void;
  onSelectVoice: (voice: Voice) => void;
  // Pagination props
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  // Error retry handler
  onRetry?: () => void;
  // Used only filter state (for empty state message)
  usedOnly?: boolean;
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
  loadingMore = false,
  onRetry,
  usedOnly = false,
}: VoiceListProps) {
  const { t } = useLanguage();

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

  // Voice cards
  // Give priority to first 4 images for LCP optimization (above-the-fold)
  return (
    <div className="space-y-3">
      {voices.map((voice, index) => (
        <VoiceCard
          key={voice.id}
          voice={voice}
          voiceName={getVoiceName(voice)}
          isPlaying={playingVoiceId === voice.id}
          onPlay={onPlayVoice}
          onSelect={onSelectVoice}
          priority={index < 4}
        />
      ))}

      {/* Loading more indicator - subtle loading state */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{t('common.loading')}</span>
          </div>
        </div>
      )}
    </div>
  );
}