'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import LanguageSelector from '@/components/common/LanguageSelector';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import VoiceTagSelector from '@/components/features/voices/VoiceTagSelector';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import type { LocaleOption } from '@/types/config';

/**
 * Voices Gallery Page (Mobile-First Design)
 *
 * Features:
 * - Search bar with language selector
 * - Left panel: Voice filters and categories
 * - Right panel: Voice cards grid
 */
export default function VoicesPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { setTitle } = useStudio();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Language selector state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LocaleOption | null>(null);

  // Tag selector state
  const [selectedTagId, setSelectedTagId] = useState('all');

  // Set page title
  useEffect(() => {
    setTitle('Voice Gallery');
  }, [setTitle]);

  // Get all available language options from localeMapper
  const availableLanguages = getAllLocaleOptions();

  const handleLanguageSelect = (language: LocaleOption) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* ========== 顶部区域：搜索框 + 语言选择器 ========== */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-[48px] pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 语言选择器 - 点击打开模态框 */}
          <div className="w-[160px]">
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="w-full h-[48px] flex items-center justify-between gap-2 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-900 truncate">
                {selectedLanguage ? selectedLanguage.name : 'English (US)'}
              </span>
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 语言选择器模态框 */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={availableLanguages}
        onSelect={handleLanguageSelect}
      />

      {/* ========== 内容区域：左侧筛选器 + 右侧语音卡片 ========== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧标签选择器 */}
        <div className="w-[180px] border-r border-gray-200">
          <VoiceTagSelector
            selectedTagId={selectedTagId}
            onTagSelect={setSelectedTagId}
          />
        </div>

        {/* 右侧语音卡片网格 */}
        <div className="flex-1 bg-white p-4 overflow-y-auto">
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Voice Cards Grid</p>
            <p className="text-xs mt-1">Selected Tag: {selectedTagId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}