'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LyricsEditorProps {
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  onRegenerate: () => void;
  onGenerateWithPrompt: (customPrompt: string) => void;
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
  onGenerateWithPrompt,
  isGenerating,
}: LyricsEditorProps) {
  const { t } = useLanguage();
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Handle generate button click - open modal
  const handleGenerateClick = () => {
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // Handle modal generate button click
  const handleGenerate = () => {
    setShowPromptModal(false);
    onGenerateWithPrompt(customPrompt);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowPromptModal(false);
    setCustomPrompt('');
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
          <p className="text-gray-600">{t('studio.aiSong.lyricsEditor.generating')}</p>
        </div>
      </div>
    );
  }

  // Show generate button when no lyrics
  if (!lyrics) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-fuchsia-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-gray-500 text-center">
            {t('studio.aiSong.lyricsEditor.generateLyricsDesc')}
          </p>
          <button
            type="button"
            onClick={handleGenerateClick}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-pink-200"
          >
            <Sparkles className="w-5 h-5" />
            {t('studio.aiSong.lyricsEditor.generateLyrics')}
          </button>
        </div>

        {/* Prompt Modal */}
        {showPromptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('studio.aiSong.lyricsEditor.promptModalTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t('studio.aiSong.lyricsEditor.promptModalSubtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t('studio.aiSong.lyricsEditor.promptPlaceholder')}
                  className="w-full h-32 p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none text-sm"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{customPrompt.length}/200</p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('studio.aiSong.lyricsEditor.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('studio.aiSong.lyricsEditor.generate')}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lyrics Textarea */}
      <div className="relative">
        <textarea
          value={lyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder={t('studio.aiSong.lyricsEditor.placeholder')}
          className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
        />

        {/* Character Count */}
        {lyrics.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
            {lyrics.length} {t('studio.aiSong.lyricsEditor.characters')}
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
        {t('studio.aiSong.lyricsEditor.regenerate')}
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
            <span className="font-medium">{t('studio.aiSong.lyricsEditor.tipTitle')}</span>
            {t('studio.aiSong.lyricsEditor.tipContent')}
          </p>
        </div>
      </div>
    </div>
  );
}
