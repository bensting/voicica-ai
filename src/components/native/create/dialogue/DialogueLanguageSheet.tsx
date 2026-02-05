'use client';

import { useState } from 'react';
import { DIALOGUE_LANGUAGES } from '@/config/native/dialogueConfig';
import { useLanguage } from '@/contexts/LanguageContext';

interface DialogueLanguageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (code: string) => void;
}

// 搜索图标
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

/**
 * Dialogue 语言选择器 - 底部弹出
 */
export default function DialogueLanguageSheet({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
}: DialogueLanguageSheetProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // 过滤语言
  const filteredLanguages = DIALOGUE_LANGUAGES.filter((lang) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  const handleSelect = (code: string) => {
    onSelect(code);
    onClose();
    setSearchQuery('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[10000]"
        onClick={() => {
          onClose();
          setSearchQuery('');
        }}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-gray-900 rounded-t-2xl animate-slide-up flex flex-col"
        style={{
          maxHeight: '70vh',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{t('native.createDialogue.language')}</h3>
              <p className="text-gray-400 text-sm">{t('native.createDialogue.selectLanguage')}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('native.createDialogue.searchLanguage')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Language List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  selectedCode === lang.code
                    ? 'bg-purple-500/20 border border-purple-500'
                    : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={`text-sm ${selectedCode === lang.code ? 'text-purple-400 font-medium' : 'text-white'}`}>
                    {lang.name}
                  </span>
                  {lang.name !== lang.nativeName && (
                    <span className="text-gray-500 text-xs">{lang.nativeName}</span>
                  )}
                </div>
                {selectedCode === lang.code && (
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}

            {filteredLanguages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No languages found
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
