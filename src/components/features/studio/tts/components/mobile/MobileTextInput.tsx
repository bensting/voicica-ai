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

interface MobileTextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxCharacters: number;
  availableCharacters: number;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Mobile Text Input Component
 *
 * Large textarea for mobile TTS with character counter at bottom
 */
export default function MobileTextInput({
  value,
  onChange,
  maxCharacters,
  disabled = false,
  placeholder = '在此输入入您要转换的文件，我们将辨别您的文字并自动替换为相应语言。',
}: MobileTextInputProps) {
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
          {/* Left: Document icon and character info */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-700 font-medium">
              {value.length}字元剩餘
            </span>
          </div>

          {/* Right: Character count and refresh button */}
          <div className="flex items-center gap-3">
            {/* Character count badge */}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-600 text-sm">
                {value.length} / {maxCharacters}
              </span>
            </div>

            {/* Refresh icon */}
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || value.length === 0}
              className="p-1 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear text"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
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