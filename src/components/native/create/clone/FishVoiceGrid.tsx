'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchFishVoices } from '@/actions/clone';
import type { FishVoiceItem, ClonedVoiceData } from '@/actions/clone';
import { Search, Mic, Play, Pause, ChevronDown, Trash2 } from 'lucide-react';

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
  const [voices, setVoices] = useState<FishVoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [showCloned, setShowCloned] = useState(true);
  const [showLibrary, setShowLibrary] = useState(true);

  // Load default voices on mount
  useEffect(() => {
    loadVoices('');
  }, []);

  const loadVoices = async (searchQuery: string) => {
    setLoading(true);
    try {
      const result = await searchFishVoices(searchQuery || undefined, 1, 30);
      setVoices(result.items);
    } catch {
      console.error('Failed to load Fish voices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadVoices(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const togglePlay = useCallback((url: string, id: string) => {
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
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('native.createClone.generate.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors"
        >
          {t('native.createClone.generate.searchButton')}
        </button>
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
                <button
                  key={`cloned-${voice.id}`}
                  onClick={() => onSelectCloned(voice)}
                  className={`relative p-3 rounded-xl text-left transition-all ${
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

                  {/* Play sample */}
                  {voice.sampleAudioUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(voice.sampleAudioUrl!, `cloned-${voice.id}`);
                      }}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                    >
                      {playingId === `cloned-${voice.id}` ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Delete button */}
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voice Library Section */}
      <div>
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"
        >
          <span>{t('native.createClone.generate.fishLibrary')}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showLibrary ? '' : '-rotate-90'}`} />
        </button>

        {showLibrary && (
          <>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : voices.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => onSelect(voice)}
                    className={`relative p-3 rounded-xl text-left transition-all ${
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
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Mic className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{voice.title}</div>
                        <div className="text-gray-500 text-xs truncate">
                          {voice.languages.join(', ') || voice.authorName}
                        </div>
                      </div>
                    </div>

                    {/* Play sample */}
                    {voice.sampleUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay(voice.sampleUrl!, voice.id);
                        }}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                      >
                        {playingId === voice.id ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>{t('native.createClone.generate.noResults')}</p>
                <p className="text-sm mt-1">{t('native.createClone.generate.tryDifferentSearch')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
