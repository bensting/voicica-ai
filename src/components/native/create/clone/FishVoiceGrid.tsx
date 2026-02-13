'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchFishVoices } from '@/actions/clone';
import type { FishVoiceItem, ClonedVoiceData } from '@/actions/clone';
import { Search, Mic, Play, Pause, ChevronDown, Trash2 } from 'lucide-react';

// Fish Audio supported languages
const FISH_LANGUAGES = [
  { code: '', label: 'All' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
] as const;

// Generate a consistent color from a string
function stringToColor(str: string): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-green-500',
    'from-pink-500 to-fuchsia-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

interface FishVoiceGridProps {
  selectedVoice: FishVoiceItem | null;
  onSelect: (voice: FishVoiceItem) => void;
  clonedVoices: ClonedVoiceData[];
  onSelectCloned: (voice: ClonedVoiceData) => void;
  selectedClonedVoice: ClonedVoiceData | null;
  onDeleteCloned?: (id: number) => void;
}

export default function FishVoiceGrid({
  selectedVoice,
  onSelect,
  clonedVoices,
  onSelectCloned,
  selectedClonedVoice,
  onDeleteCloned,
}: FishVoiceGridProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [voices, setVoices] = useState<FishVoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [showCloned, setShowCloned] = useState(true);

  const loadVoices = useCallback(async (searchQuery: string, lang: string) => {
    setLoading(true);
    try {
      const result = await searchFishVoices(searchQuery || undefined, 1, 30, lang || undefined);
      setVoices(result.items);
    } catch {
      console.error('Failed to load Fish voices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load default voices on mount
  useEffect(() => {
    loadVoices('', '');
  }, [loadVoices]);

  const handleSearch = () => {
    loadVoices(query, language);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    loadVoices(query, lang);
  };

  const togglePlay = useCallback((e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    if (playingId === id && audioRef) {
      audioRef.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef) {
      audioRef.pause();
    }

    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    setAudioRef(audio);
    setPlayingId(id);
  }, [playingId, audioRef]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef) audioRef.pause();
    };
  }, [audioRef]);

  return (
    <div>
      {/* Sticky top: Search + Language Filter + Cloned Voices */}
      <div className="sticky top-0 z-10 bg-[#0a0a1a] pb-3 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('native.createClone.generate.searchPlaceholder')}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Language Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FISH_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                language === lang.code
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* My Cloned Voices Section */}
        {clonedVoices.length > 0 && (
          <div>
            <button
              onClick={() => setShowCloned(!showCloned)}
              className="flex items-center gap-2 text-sm font-medium text-purple-400 mb-2"
            >
              <Mic className="w-4 h-4" />
              <span>{t('native.createClone.generate.myClonedVoices')}</span>
              <span className="text-gray-500 text-xs">({clonedVoices.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCloned ? '' : '-rotate-90'}`} />
            </button>

            {showCloned && (
              <div className="grid grid-cols-2 gap-2">
                {clonedVoices.map((voice) => (
                  <div
                    key={`cloned-${voice.id}`}
                    onClick={() => onSelectCloned(voice)}
                    role="button"
                    tabIndex={0}
                    className={`relative p-3 rounded-xl text-left transition-all cursor-pointer ${
                      selectedClonedVoice?.id === voice.id
                        ? 'bg-purple-600/30 border border-purple-500/50 ring-1 ring-purple-500/30'
                        : 'bg-gray-800/40 border border-gray-700/30 hover:border-gray-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{voice.name}</div>
                        <div className="text-gray-500 text-xs truncate">
                          {voice.status === 'TRAINING' ? 'Training...' : 'Ready'}
                        </div>
                      </div>
                    </div>

                    {voice.sampleAudioUrl && (
                      <button
                        onClick={(e) => togglePlay(e, voice.sampleAudioUrl!, `cloned-${voice.id}`)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                      >
                        {playingId === `cloned-${voice.id}` ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {onDeleteCloned && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCloned(voice.id);
                        }}
                        className="absolute bottom-2 right-2 p-1 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice list (scrolls with parent) */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : voices.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {voices.map((voice) => (
            <div
              key={voice.id}
              onClick={() => onSelect(voice)}
              role="button"
              tabIndex={0}
              className={`relative p-3 rounded-xl text-left transition-all cursor-pointer ${
                selectedVoice?.id === voice.id
                  ? 'bg-purple-600/30 border border-purple-500/50 ring-1 ring-purple-500/30'
                  : 'bg-gray-800/40 border border-gray-700/30 hover:border-gray-600/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {voice.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={voice.coverImage}
                    alt={voice.title}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${stringToColor(voice.id)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{getInitials(voice.title)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{voice.title}</div>
                  <div className="text-gray-500 text-xs truncate">
                    {voice.languages.join(', ') || voice.authorName}
                  </div>
                </div>
              </div>

              {voice.sampleUrl && (
                <button
                  onClick={(e) => togglePlay(e, voice.sampleUrl!, voice.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                >
                  {playingId === voice.id ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>{t('native.createClone.generate.noResults')}</p>
          <p className="text-sm mt-1">{t('native.createClone.generate.tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  );
}
