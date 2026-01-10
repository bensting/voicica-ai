'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUp } from 'lucide-react';
import { getPromoVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';
import VoiceSampleGrid from './VoiceSampleGrid';
import { getLanguageOptions } from './languageConfig';

interface VoiceSelectorSectionProps {
  /** 默认选中的语言 */
  defaultLanguage: string;
  /** 无语音时的提示文字 */
  emptyText?: string;
}

/**
 * Voice Selector Section - 语音选择器区域组件
 *
 * 包含：
 * - 语言选择下拉框
 * - 语音样本网格
 * - 自动加载语音数据
 */
export default function VoiceSelectorSection({
  defaultLanguage,
  emptyText = 'No voices available',
}: VoiceSelectorSectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get sorted language options (default language first)
  const languages = useMemo(() => getLanguageOptions(defaultLanguage), [defaultLanguage]);

  // Load voices when language changes
  useEffect(() => {
    async function loadVoices() {
      setLoading(true);
      try {
        const [celebrityVoices, professionalVoices] = await Promise.all([
          getPromoVoices(selectedLanguage, 'Celebrity', 20),
          getPromoVoices(selectedLanguage, 'Professional', 20),
        ]);
        const combinedVoices = [...celebrityVoices, ...professionalVoices].slice(0, 20);
        setVoices(combinedVoices);
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVoices();
  }, [selectedLanguage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setIsDropdownOpen(false);
  };

  const selectedLangOption = languages.find(l => l.code === selectedLanguage) || languages[0];

  return (
    <>
      {/* Language Selector */}
      <div className="flex justify-center mb-4 px-2">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white transition-colors min-w-[140px] justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <span>{selectedLangOption.flag}</span>
              <span>{selectedLangOption.name}</span>
            </span>
            <ChevronUp className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? '' : 'rotate-180'}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                    selectedLanguage === lang.code ? 'text-purple-400 bg-gray-800' : 'text-gray-300'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Voice Grid */}
      <VoiceSampleGrid
        voices={voices}
        loading={loading}
        emptyText={emptyText}
      />
    </>
  );
}