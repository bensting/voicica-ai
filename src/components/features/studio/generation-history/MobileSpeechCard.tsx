'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import MobileAudioPlayer from './MobileAudioPlayer';
import TextExpandModal from './TextExpandModal';
import ShareModal from '@/components/ui/ShareModal';
import { getStatusLabel, getStatusColor } from '@/types/tts';
import type { Generation } from '@/types/tts';

interface MobileSpeechCardProps {
  generation: Generation;
  onDelete: () => void;
  onDownload: () => void;
}

/**
 * Mobile Speech Card Component
 *
 * Optimized with React.memo to prevent unnecessary re-renders
 * Only re-renders when generation data or callbacks change
 */
function MobileSpeechCard({ generation, onDelete, onDownload }: MobileSpeechCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleToggleTextExpanded = useCallback(() => {
    setIsTextExpanded(prev => !prev);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsTextExpanded(false);
  }, []);

  const handleOpenShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleCloseShare = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  // Check if text is truncated - debounced for better performance
  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        // Use scrollHeight comparison with a small threshold for rounding errors
        const isTrunc = element.scrollHeight > element.clientHeight + 1;
        setIsTruncated(isTrunc);
      }
    };

    // Delay check to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkTruncation, 0);

    // Debounced resize handler to improve performance
    let resizeTimer: NodeJS.Timeout;
    const debouncedCheckTruncation = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkTruncation, 150);
    };

    window.addEventListener('resize', debouncedCheckTruncation);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedCheckTruncation);
    };
  }, [generation.text]);

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header: Timestamp, Status, Character Count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">{generation.timestamp}</span>
          {generation.status && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${getStatusColor(generation.status)}`}>
              {getStatusLabel(generation.status)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded whitespace-nowrap">
            {generation.characterCount} characters
          </span>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div className="mb-3 relative">
        <p
          ref={textRef}
          className={`text-sm text-gray-900 line-clamp-2 ${isTruncated ? 'pr-6' : ''}`}
        >
          {generation.text}
        </p>
        {isTruncated && (
          <button
            onClick={handleToggleTextExpanded}
            className="absolute top-0 right-0 p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
            title={isTextExpanded ? "Hide full text" : "View full text"}
          >
            {isTextExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Audio Player */}
      {generation.audioUrl && (
        <MobileAudioPlayer
          audioUrl={generation.audioUrl}
          duration={generation.duration}
          isPlaying={isPlaying}
          onPlay={handleTogglePlay}
          onDownload={onDownload}
          onShare={generation.shareId ? handleOpenShare : undefined}
          voiceAvatar={generation.voiceAvatar}
          voiceName={generation.voiceName}
          voiceDisplayName={generation.voiceDisplayName}
        />
      )}
    </div>

      {/* Text Expand Modal */}
      <TextExpandModal
        isOpen={isTextExpanded}
        text={generation.text}
        onClose={handleCloseModal}
      />

      {/* Share Modal */}
      {generation.shareId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleCloseShare}
          shareId={generation.shareId}
          text={generation.text}
        />
      )}
    </>
  );
}

/**
 * Export memoized component to prevent unnecessary re-renders
 * Component will only re-render when:
 * - generation.id changes (new record)
 * - generation status changes (polling updates)
 * - generation data changes
 * - onDelete/onDownload callbacks change
 */
export default memo(MobileSpeechCard, (prevProps, nextProps) => {
  // Custom comparison: only re-render if generation data actually changed
  return (
    prevProps.generation.id === nextProps.generation.id &&
    prevProps.generation.status === nextProps.generation.status &&
    prevProps.generation.text === nextProps.generation.text &&
    prevProps.generation.audioUrl === nextProps.generation.audioUrl &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onDownload === nextProps.onDownload
  );
});