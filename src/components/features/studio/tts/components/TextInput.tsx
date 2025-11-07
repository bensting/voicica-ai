'use client';

import { useState } from 'react';

interface ExampleButton {
  id: string;
  label: string;
  text: string;
}

const EXAMPLE_BUTTONS: ExampleButton[] = [
  {
    id: 'greeting',
    label: '问候语',
    text: '你好！很高兴见到你。今天过得怎么样？',
  },
  {
    id: 'ebook',
    label: '电子书',
    text: '在一个宁静的小村庄里，住着一位善良的老人。他每天都会在村口的大树下讲述古老的故事。',
  },
  {
    id: 'podcast',
    label: '播客',
    text: '欢迎收听今天的节目。在本期节目中，我们将探讨人工智能技术的最新发展。',
  },
];

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
  placeholder = '在此输入入您要转换的文件，我们将辨别您的文字并自动替换为相应语言。',
  onGenerate,
  isGenerating = false,
  canGenerate = false,
}: TextInputProps) {
  const [showExamples, setShowExamples] = useState(true);

  const handleSelectExample = (text: string) => {
    onChange(text);
    setShowExamples(false);
  };

  return (
    <div className="relative h-full flex flex-col bg-white rounded-2xl overflow-visible shadow-sm border border-gray-200">
      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 h-0 w-full p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed rounded-t-2xl"
        maxLength={maxCharacters}
      />

      {/* Bottom Bar with Character Counter and Example Buttons */}
      <div className="relative bg-purple-50 border-t border-purple-100 rounded-b-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Character count */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-600 text-base font-medium">
              {value.length} / {maxCharacters}
            </span>
          </div>

          {/* Right: Generate button (Desktop only) */}
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating || disabled}
              className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Floating Example Buttons - 悬浮在底部栏上方 */}
        {showExamples && (
          <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📌</span>
                  <span className="text-xs font-medium text-gray-600">
                    试试这些范例
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