'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Video prompt input component
 */
export default function PromptInput({
  value,
  onChange,
  maxLength = 1000,
  disabled = false,
  placeholder,
}: PromptInputProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder || t('video.promptPlaceholder')}
        className={`
          flex-1 w-full p-4 rounded-xl
          border-2 border-gray-200 focus:border-purple-400
          focus:outline-none focus:ring-2 focus:ring-purple-100
          resize-none text-gray-700 placeholder-gray-400
          transition-colors duration-200
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
        `}
      />
      <div className="flex justify-end mt-2 text-sm text-gray-500">
        <span className={value.length >= maxLength ? 'text-red-500' : ''}>
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}