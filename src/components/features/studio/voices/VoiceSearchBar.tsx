import { Search } from 'lucide-react';
import type { LocaleOption } from '@/types/config';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLanguage: LocaleOption | null;
  onLanguageClick: () => void;
}

/**
 * Voice search bar with language selector
 */
export default function VoiceSearchBar({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageClick,
}: VoiceSearchBarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-b from-gray-50 to-white">
      <div className="flex items-center gap-3 max-w-3xl lg:mx-auto">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('voiceFilters.search')}
            className="w-full h-[44px] pl-10 pr-4 bg-gray-100 border-0 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Language selector button */}
        <div className="w-[140px]">
          <button
            onClick={onLanguageClick}
            className="w-full h-[44px] flex items-center justify-between gap-2 px-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm text-gray-700 truncate font-medium">
              {selectedLanguage ? selectedLanguage.name : t('voiceFilters.allLanguages')}
            </span>
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}