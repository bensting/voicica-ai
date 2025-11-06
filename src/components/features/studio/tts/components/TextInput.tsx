'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eraser, Zap } from 'lucide-react';

interface VoiceModel {
  id: string;
  name: string;
  display_name: Record<string, string>;
  avatar_url: string;
  gender: string;
}

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
  selectedVoice?: VoiceModel | null;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  placeholder?: string;
}

/**
 * Responsive Text Input Component (Mobile-First)
 *
 * Mobile: Large textarea with bottom bar (character count + examples)
 * Desktop: Add top toolbar (clear + voice avatar + speed control)
 */
export default function TextInput({
  value,
  onChange,
  maxCharacters,
  availableCharacters,
  disabled = false,
  selectedVoice = null,
  speed = 1.0,
  onSpeedChange,
  placeholder = '在此输入入您要转换的文件，我们将辨别您的文字并自动替换为相应语言。',
}: TextInputProps) {
  const [showExamples, setShowExamples] = useState(true);

  const handleSelectExample = (text: string) => {
    onChange(text);
    setShowExamples(false);
  };

  return (
    <div className="relative h-full lg:h-auto flex flex-col lg:space-y-2">
      {/* Desktop Toolbar - Hidden on mobile */}
      <div className="hidden lg:flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
        {/* Left: Clear Button */}
        <button
          onClick={() => onChange('')}
          disabled={!value || disabled}
          title="清除所有内容"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser className="w-5 h-5" />
        </button>

        {/* Center: Voice Avatar */}
        <div className="flex items-center gap-2">
          {selectedVoice ? (
            <>
              <Image
                src={selectedVoice.avatar_url}
                alt={selectedVoice.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedVoice.display_name?.en || selectedVoice.name}</p>
                <p className="text-xs text-gray-500">{selectedVoice.gender}</p>
              </div>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: Speed Control */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">速度</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
            disabled={disabled}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
      </div>

      {/* Text Area Container */}
      <div className="relative flex-1 lg:flex-none flex flex-col bg-white rounded-2xl lg:rounded-xl overflow-visible shadow-sm border border-gray-200">
        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxCharacters}
          className="flex-1 lg:flex-none lg:h-48 xl:h-64 w-full p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed rounded-t-2xl lg:rounded-t-xl"
        />

        {/* Bottom Bar */}
        <div className="relative bg-purple-50 lg:bg-white border-t border-purple-100 lg:border-gray-200 rounded-b-2xl lg:rounded-b-xl">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Document icon and character info (Mobile) / Clear button (Desktop) */}
            <div className="flex items-center gap-2 text-sm lg:hidden">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-700 font-medium">
                {value.length}字元剩餘
              </span>
            </div>

            {/* Desktop: Clear button text link */}
            <button
              onClick={() => onChange('')}
              className="hidden lg:flex text-gray-600 hover:text-gray-900 items-center gap-1 disabled:opacity-50 text-sm"
              disabled={!value || disabled}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              No content? Try this:
            </button>

            {/* Right: Character count and refresh button */}
            <div className="flex items-center gap-3">
              {/* Character count badge */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className={`text-sm ${
                  availableCharacters < 20 ? 'text-red-500' : 'text-gray-600'
                }`}>
                  {value.length} / {maxCharacters}
                </span>
              </div>

              {/* Refresh icon */}
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled || value.length === 0}
                className="p-1 hover:bg-purple-100 lg:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Clear text"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Floating Example Buttons - 悬浮在底部栏上方 (Mobile) / Below textarea (Desktop) */}
          {showExamples && (
            <div className="absolute lg:static bottom-full lg:bottom-auto left-0 right-0 mb-2 lg:mb-0 px-2 lg:px-0">
              <div className="bg-white/95 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none rounded-xl lg:rounded-none shadow-lg lg:shadow-none border border-purple-100 lg:border-0 p-2 lg:p-0 lg:pt-2 lg:pb-3">
                <div className="flex items-center justify-between mb-2 px-2 lg:px-4">
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
                <div className="flex gap-1.5 flex-wrap px-1 lg:px-4">
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

        {/* Desktop: Additional hint text */}
        <div className="hidden lg:block px-4 py-2 text-sm text-gray-600">
          Limit {maxCharacters} characters per generation.{' '}
          <span className="font-medium">
            Available: {availableCharacters} characters.
          </span>
        </div>
      </div>
    </div>
  );
}