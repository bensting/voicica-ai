'use client';

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
  availableCharacters,
  disabled = false,
  placeholder = '在此输入入您要转换的文件，我们将辨别您的文字并自动替换为相应语言。',
}: MobileTextInputProps) {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden">
      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full min-h-[320px] p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        maxLength={maxCharacters}
      />

      {/* Bottom Bar with Character Counter */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-t border-purple-100">
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
    </div>
  );
}