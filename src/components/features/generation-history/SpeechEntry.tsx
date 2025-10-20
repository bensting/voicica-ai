'use client';

import { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { TaskStatus } from '@/types/tts';
import { getStatusLabel, getStatusColor } from '@/lib/api/tts';

interface Generation {
  id: string;
  text: string;
  timestamp: string;
  duration: number;
  characterCount: number;
  audioUrl: string;
  status?: TaskStatus;
  errorMessage?: string;
  voiceName?: string;
}

interface SpeechEntryProps {
  generation: Generation;
  onDelete: () => void;
  onDownload: () => void;
}

export default function SpeechEntry({ generation, onDelete, onDownload }: SpeechEntryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Check if text content exceeds 2 lines
    if (textRef.current) {
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
      const height = textRef.current.scrollHeight;
      const lines = Math.round(height / lineHeight);
      setShowExpandButton(lines > 2);
    }
  }, [generation.text]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="p-6">
      {/* Timestamp and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{generation.timestamp}</span>
          {generation.status && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(generation.status)}`}>
              {getStatusLabel(generation.status)}
            </span>
          )}
          {generation.voiceName && (
            <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
              {generation.voiceName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {generation.characterCount} characters
          </span>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Generated Text */}
      <div className="mb-4">
        <p
          ref={textRef}
          className={`text-gray-900 text-lg leading-relaxed ${!isTextExpanded ? 'line-clamp-2' : ''}`}
        >
          &ldquo;{generation.text}&rdquo;
        </p>
        {showExpandButton && (
          <button
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isTextExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {generation.errorMessage && generation.status === TaskStatus.FAILURE && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-medium">Error:</span> {generation.errorMessage}
          </p>
        </div>
      )}

      {/* Audio Player - Only show for successful generations */}
      {generation.status === TaskStatus.SUCCESS && generation.audioUrl && (
        <AudioPlayer
          audioUrl={generation.audioUrl}
          duration={generation.duration}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onDownload={onDownload}
        />
      )}

      {/* Processing/Pending State */}
      {(generation.status === TaskStatus.PROCESSING || generation.status === TaskStatus.PENDING) && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800">
            {generation.status === TaskStatus.PROCESSING ? 'Processing audio...' : 'Waiting to process...'}
          </span>
        </div>
      )}
    </div>
  );
}
