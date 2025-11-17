'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExampleButton {
  id: string;
  label: string;
  text: string;
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxCharacters: number;
  availableCharacters: number;
  disabled?: boolean;
  placeholder?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  canGenerate?: boolean;
  remainingCredits?: number;
  onClear?: () => void; // 新增：清空输入框回调
}

/**
 * Text Input Component
 *
 * Large textarea for TTS with character counter at bottom
 */
export default function TextInput({
  value,
  onChange,
  maxCharacters,
  disabled = false,
  placeholder,
  onGenerate,
  isGenerating = false,
  canGenerate = false,
  remainingCredits = 0,
  onClear,
}: TextInputProps) {
  const { t } = useLanguage();
  const [showExamples, setShowExamples] = useState(true);
  // Track if component has mounted (client-side only)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Get example buttons from i18n
  const EXAMPLE_BUTTONS: ExampleButton[] = [
    {
      id: 'greeting',
      label: t('ttsInput.examples.greeting.label'),
      text: t('ttsInput.examples.greeting.text'),
    },
    {
      id: 'ebook',
      label: t('ttsInput.examples.ebook.label'),
      text: t('ttsInput.examples.ebook.text'),
    },
    {
      id: 'podcast',
      label: t('ttsInput.examples.podcast.label'),
      text: t('ttsInput.examples.podcast.text'),
    },
  ];

  const handleSelectExample = (text: string) => {
    onChange(text);
    setShowExamples(false);
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-white rounded-2xl overflow-visible shadow-sm border border-gray-200">
      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || t('ttsInput.placeholder')}
        className="flex-1 h-0 w-full p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed rounded-t-2xl"
        maxLength={maxCharacters}
      />

      {/* Bottom Bar with Character Counter and Example Buttons */}
      <div className="relative bg-purple-50 border-t border-purple-100 rounded-b-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Remaining Credits */}
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
            </svg>
            <span className="text-sm lg:text-base font-medium text-gray-700">
              {remainingCredits.toLocaleString()} {t('ttsInput.creditsLeft')}
            </span>
          </div>

          {/* Right: Clear button, Character count and Desktop Generate button */}
          <div className="flex items-center gap-2">
            {/* Clear button - only render after mount and when there's text */}
            {hasMounted && value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1 hover:bg-purple-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                aria-label="Clear text"
                title="清空输入框"
              >
                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            )}

            {/* Character count - 只显示数字，不显示文档图标 */}
            <span className="text-gray-400 text-sm font-normal">
              {value.length} / {maxCharacters}
            </span>

            {/* Desktop Generate button */}
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating || disabled}
                className="hidden lg:flex items-center gap-2 px-6 py-2.5 ml-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('ttsInput.generating')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{t('ttsInput.generateSpeech')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Floating Example Buttons - 悬浮在底部栏上方 */}
        {showExamples && (
          <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📌</span>
                  <span className="text-xs font-medium text-gray-600">
                    {t('ttsInput.tryExamples')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExamples(false)}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Close examples"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap px-1">
                {EXAMPLE_BUTTONS.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => handleSelectExample(example.text)}
                    disabled={disabled}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}