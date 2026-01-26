'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  creditsCost?: number;
}

/**
 * Video generation button
 */
export default function GenerateButton({
  onClick,
  disabled = false,
  isGenerating = false,
  creditsCost,
}: GenerateButtonProps) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={`
        w-full py-3.5 px-6 rounded-xl font-semibold text-base
        flex items-center justify-center gap-2
        transition-all duration-200
        ${disabled || isGenerating
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200/50 hover:shadow-xl hover:shadow-pink-300/50 transform hover:-translate-y-0.5'
        }
      `}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('video.generating')}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>{t('video.generate')}</span>
          {creditsCost && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {creditsCost} {t('common.credits')}
            </span>
          )}
        </>
      )}
    </button>
  );
}