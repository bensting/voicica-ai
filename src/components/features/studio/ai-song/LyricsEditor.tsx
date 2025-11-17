'use client';

import { Sparkles } from 'lucide-react';

interface LyricsEditorProps {
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

/**
 * Lyrics Editor Component
 *
 * 歌词编辑器组件 - 支持编辑和重新生成
 */
export default function LyricsEditor({
  lyrics,
  onLyricsChange,
  onRegenerate,
  isGenerating,
}: LyricsEditorProps) {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
          <p className="text-gray-600">正在生成歌词...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lyrics Textarea */}
      <div className="relative">
        <textarea
          value={lyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder="歌词将在这里显示..."
          className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
        />

        {/* Character Count */}
        {lyrics.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
            {lyrics.length} 字符
          </div>
        )}
      </div>

      {/* Regenerate Button */}
      <button
        type="button"
        onClick={onRegenerate}
        className="w-full py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        重新生成歌词
      </button>

      {/* Tips */}
      <div className="flex items-start gap-2 p-3 bg-pink-50 rounded-lg">
        <svg className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-pink-700">
            <span className="font-medium">提示：</span>
            你可以直接编辑歌词，或点击&ldquo;重新生成&rdquo;让 AI 创作新的版本
          </p>
        </div>
      </div>
    </div>
  );
}
