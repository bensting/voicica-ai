'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode; // emoji, SVG component, or any React node
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  prefixIcon?: ReactNode; // 左侧固定图标
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  prefixIcon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // 过滤选项
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition-colors text-sm text-left flex items-center justify-between ${
          disabled
            ? 'bg-gray-50 cursor-not-allowed border-gray-200'
            : isOpen
            ? 'border-purple-500 bg-white'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <span className="flex items-center gap-2">
          {/* 固定的前缀图标 */}
          {prefixIcon && (
            <span className="text-gray-500 flex-shrink-0">{prefixIcon}</span>
          )}
          {/* 选中的选项或占位符 */}
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="w-5 h-4 inline-flex items-center justify-center flex-shrink-0">{selectedOption.icon}</span>}
              <span className="text-gray-900">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* 搜索框 */}
          {options.length > 5 && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* 选项列表 */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                    option.value === value
                      ? 'bg-purple-50 text-purple-700'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  {option.icon && <span className="w-5 h-4 inline-flex items-center justify-center flex-shrink-0">{option.icon}</span>}
                  <span>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}