'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

interface LanguageDropdownProps {
  options: LanguageOption[];
  selected: string;
  onSelect: (code: string) => void;
}

/**
 * Language Dropdown - 语言选择下拉框
 *
 * 用于 TTS 落地页的语言切换
 */
export default function LanguageDropdown({
  options,
  selected,
  onSelect,
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(l => l.code === selected) || options[0];

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 md:gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full px-2 md:px-4 py-1.5 md:py-2 text-white transition-colors min-w-[90px] md:min-w-[140px] justify-between text-xs md:text-sm"
      >
        <span className="flex items-center gap-1 md:gap-2">
          <span className="text-xs">{selectedOption.flag}</span>
          <span className="truncate max-w-[50px] md:max-w-none">{selectedOption.name}</span>
        </span>
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
          {options.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                selected === lang.code ? 'text-purple-400 bg-gray-800' : 'text-gray-300'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}