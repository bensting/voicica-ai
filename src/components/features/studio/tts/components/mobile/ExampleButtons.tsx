'use client';

import { useState } from 'react';

interface ExampleButton {
  id: string;
  label: string;
  text: string;
}

interface ExampleButtonsProps {
  onSelectExample: (text: string) => void;
  disabled?: boolean;
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

/**
 * Example Buttons Component
 *
 * Quick example text buttons for mobile TTS with close functionality
 */
export default function ExampleButtons({
  onSelectExample,
  disabled = false,
}: ExampleButtonsProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Don't render if closed
  if (!isVisible) {
    return null;
  }

  return (
    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📌</span>
          <span className="text-sm font-semibold text-gray-700">
            试试这些范例
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-purple-100 rounded-lg transition-colors"
          aria-label="Close examples"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Example Buttons */}
      <div className="flex gap-2 flex-wrap">
        {EXAMPLE_BUTTONS.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => onSelectExample(example.text)}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}