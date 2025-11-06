'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Trash2, Play } from 'lucide-react';
import type { Generation } from '@/types/tts';

interface RecentGenerationsListProps {
  generations: Generation[];
  loading: boolean;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

/**
 * Simplified Recent Generations List for TTS Page
 * Shows last 6 generations in a compact format
 */
export default function RecentGenerationsList({
  generations,
  loading,
  onDelete,
  onDownload,
}: RecentGenerationsListProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = (id: string, audioUrl: string) => {
    if (playingId === id) {
      setPlayingId(null);
      // Stop audio
    } else {
      setPlayingId(id);
      // Play audio
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
      audio.onended = () => setPlayingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-4 px-4 pt-4 pb-0 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('recent')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'recent'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent auditions
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All records
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-gray-50">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">无播报记录</h3>
            <p className="text-sm text-gray-500">暂无播报记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
              >
                {/* Play Button */}
                <button
                  onClick={() => handlePlay(gen.id, gen.audioUrl || '')}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex-shrink-0"
                  disabled={!gen.audioUrl}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                </button>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{gen.text}</p>
                </div>

                {/* Voice Info */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {gen.voiceAvatar ? (
                    <Image
                      src={gen.voiceAvatar}
                      alt={gen.voiceName || ''}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs text-purple-600">🎤</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-600">{gen.voiceName}</span>
                </div>

                {/* Duration */}
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {gen.duration ? `${gen.duration}s` : '00:00/00:04'}
                </div>

                {/* Progress Bar (placeholder) */}
                <div className="w-32 h-1 bg-gray-200 rounded-full flex-shrink-0">
                  <div className="w-0 h-full bg-purple-600 rounded-full" />
                </div>

                {/* Download Button */}
                <button
                  onClick={() => onDownload(gen.id)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onDelete(gen.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}