'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CreditsIcon from '@/components/icons/CreditsIcon';

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
  creditsLoading?: boolean;
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
  creditsLoading = false,
  onClear,
}: TextInputProps) {
  const { t } = useLanguage();
  // 初始值设为 true，等 hydration 完成后再根据 value 决定是否显示
  const [showExamples, setShowExamples] = useState(true);
  // Track if component has mounted (client-side only)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // hydration 完成后，如果有值则隐藏示例
    if (value && value.length > 0) {
      setShowExamples(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get example buttons from i18n
  const EXAMPLE_BUTTONS: ExampleButton[] = [
    {
      id: 'greeting',
      label: t('tts.input.examples.greeting.label'),
      text: t('tts.input.examples.greeting.text'),
    },
    {
      id: 'ebook',
      label: t('tts.input.examples.ebook.label'),
      text: t('tts.input.examples.ebook.text'),
    },
    {
      id: 'podcast',
      label: t('tts.input.examples.podcast.label'),
      text: t('tts.input.examples.podcast.text'),
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
        placeholder={placeholder || t('tts.input.placeholder')}
        className="flex-1 h-0 w-full p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed rounded-t-2xl"
        maxLength={maxCharacters}
      />

      {/* Bottom Bar with Character Counter and Example Buttons */}
      <div className="relative bg-purple-50 border-t border-purple-100 rounded-b-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Remaining Credits */}
          <div className="flex items-center gap-1.5">
            <CreditsIcon className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
            <span className="text-sm lg:text-base font-medium text-gray-700">
              {creditsLoading ? (
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                remainingCredits.toLocaleString()
              )}{' '}
              {t('tts.input.creditsLeft')}
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
              {hasMounted ? value.length : 0} / {maxCharacters}
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
                    <span>{t('tts.input.generating')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{t('tts.input.generateSpeech')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Floating Example Buttons - 悬浮在底部栏上方 */}
        {/* 只有在客户端 hydration 完成后才显示，避免 SSR 不匹配 */}
        {hasMounted && showExamples && (
          <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 p-2">
              {/* 移动端：两行布局，桌面端：单行布局 */}
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
                {/* 第一行：标题和移动端关闭按钮 */}
                <div className="flex items-center justify-between lg:contents">
                  {/* 标题 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-sm">📌</span>
                    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      {t('tts.input.tryExamples')}
                    </span>
                  </div>

                  {/* 移动端关闭按钮 */}
                  <button
                    type="button"
                    onClick={() => setShowExamples(false)}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors lg:hidden flex-shrink-0"
                    aria-label="Close examples"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 第二行（移动端）/ 中间部分（桌面端）：按钮 */}
                <div className="flex gap-1.5 flex-wrap lg:flex-nowrap lg:ml-3">
                  {EXAMPLE_BUTTONS.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      onClick={() => handleSelectExample(example.text)}
                      disabled={disabled}
                      className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-[11px] font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>

                {/* 桌面端关闭按钮 */}
                <button
                  type="button"
                  onClick={() => setShowExamples(false)}
                  className="hidden lg:block p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0 ml-3"
                  aria-label="Close examples"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}