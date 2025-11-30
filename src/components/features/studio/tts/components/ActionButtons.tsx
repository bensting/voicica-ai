'use client';

import { Loader2, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActionButtonsProps {
  onGenerate: () => void;
  onOpenSettings?: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

/**
 * Responsive Action Buttons Component (Mobile-First)
 *
 * Mobile: Settings button + Generate button (side by side)
 * Desktop: Only Generate button (full width)
 */
export default function ActionButtons({
  onGenerate,
  onOpenSettings,
  isGenerating,
  canGenerate,
}: ActionButtonsProps) {
  const { t } = useLanguage();
  return (
    <>
      {/* Mobile: Settings + Generate buttons */}
      <div className="lg:hidden flex items-center gap-2">
        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-200 rounded-full hover:border-purple-300 transition-colors flex-shrink-0"
          aria-label="Settings"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Generate Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{t('tts.input.generating')}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-sm">{t('tts.input.generateSpeech')}</span>
            </>
          )}
        </button>
      </div>

      {/* Desktop: Only Generate button (full width) */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className={`hidden lg:flex w-full py-4 rounded-xl font-semibold text-lg transition-all items-center justify-center gap-2 ${
          !canGenerate
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            GENERATE
          </>
        )}
      </button>
    </>
  );
}