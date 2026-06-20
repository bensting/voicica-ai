'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchFishVoices } from '@/actions/clone';
import type { FishVoiceItem, ClonedVoiceData, SearchFishVoicesResult } from '@/actions/clone';
import { Search, Mic, Play, Pause, Trash2, Loader2, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'fish_voice_language';
const DEFAULT_LANGUAGE = 'en';
const PAGE_SIZE = 10;
const MY_CLONES = 'my_clones';


function getSavedLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
}

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
  onGoToCloneTab?: () => void;
}

export default function FishVoiceGrid({
  selectedVoice,
  onSelect,
  clonedVoices,
  onSelectCloned,
  selectedClonedVoice,
  onDeleteCloned,
  onGoToCloneTab,
}: FishVoiceGridProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(MY_CLONES);
  const [voices, setVoices] = useState<FishVoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const isMyClones = filter === MY_CLONES;

  const clientCache = useRef<Map<string, SearchFishVoicesResult>>(new Map());
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);

  const loadVoices = useCallback(async (searchQuery: string, lang: string, pageNum: number, append: boolean) => {
    const requestId = ++requestIdRef.current;

    const cacheKey = `${searchQuery}|${lang}|${pageNum}`;
    const cached = clientCache.current.get(cacheKey);
    if (cached) {
      if (append) {
        setVoices(prev => [...prev, ...cached.items]);
      } else {
        setVoices(cached.items);
      }
      setHasMore(cached.total > pageNum * PAGE_SIZE);
      setLoadingMore(false);
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingMore(false);
      setLoading(true);
    }

    try {
      const result = await searchFishVoices(searchQuery || undefined, pageNum, PAGE_SIZE, lang || undefined);
      if (requestId !== requestIdRef.current) return;

      clientCache.current.set(cacheKey, result);
      if (append) {
        setVoices(prev => [...prev, ...result.items]);
      } else {
        setVoices(result.items);
      }
      setHasMore(result.total > pageNum * PAGE_SIZE);
    } catch {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load Fish voices');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved !== MY_CLONES) {
      loadVoices('', saved, 1, false);
    }
  }, [loadVoices]);

  const handleSearch = () => {
    if (isMyClones) return;
    pageRef.current = 1;
    loadVoices(query, filter, 1, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || isMyClones) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    loadVoices(query, filter, nextPage, true);
  };

  const togglePlay = useCallback((e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    if (playingId === id && audioRef) {
      audioRef.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef) audioRef.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    setAudioRef(audio);
    setPlayingId(id);
  }, [playingId, audioRef]);

  useEffect(() => {
    return () => { if (audioRef) audioRef.pause(); };
  }, [audioRef]);

  const renderVoiceCard = (voice: FishVoiceItem) => (
    <div
      key={voice.id}
      onClick={() => onSelect(voice)}
      role="button"
      tabIndex={0}
      className="flex flex-col items-center cursor-pointer group"
    >
      <div className={`relative rounded-full transition-all ${
        selectedVoice?.id === voice.id
          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a1a]'
          : ''
      }`}>
        {voice.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={voice.coverImage} alt={voice.title} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stringToColor(voice.id)} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{getInitials(voice.title)}</span>
          </div>
        )}
        {voice.sampleUrl && (
          <button
            onClick={(e) => togglePlay(e, voice.sampleUrl!, voice.id)}
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              playingId === voice.id ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
            }`}
          >
            {playingId === voice.id ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
          </button>
        )}
      </div>
      <span className={`mt-1.5 text-xs text-center leading-tight line-clamp-1 w-full px-0.5 ${
        selectedVoice?.id === voice.id ? 'text-purple-400 font-medium' : 'text-gray-300'
      }`}>{voice.title}</span>
      <span className="text-[10px] text-gray-500 leading-tight">{voice.languages[0] || voice.authorName}</span>
    </div>
  );

  const renderClonedCard = (voice: ClonedVoiceData) => (
    <div
      key={`cloned-${voice.id}`}
      onClick={() => onSelectCloned(voice)}
      role="button"
      tabIndex={0}
      className="flex flex-col items-center cursor-pointer group relative"
    >
      <div className={`relative rounded-full transition-all ${
        selectedClonedVoice?.id === voice.id
          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a1a]'
          : ''
      }`}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Mic className="w-6 h-6 text-white" />
        </div>
        {voice.sampleAudioUrl && (
          <button
            onClick={(e) => togglePlay(e, voice.sampleAudioUrl!, `cloned-${voice.id}`)}
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              playingId === `cloned-${voice.id}` ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
            }`}
          >
            {playingId === `cloned-${voice.id}` ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
          </button>
        )}
        {onDeleteCloned && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteCloned(voice.id); }}
            className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <span className={`mt-1.5 text-xs text-center leading-tight line-clamp-1 w-full px-0.5 ${
        selectedClonedVoice?.id === voice.id ? 'text-purple-400 font-medium' : 'text-gray-300'
      }`}>{voice.name}</span>
      <span className="text-[10px] text-gray-500 leading-tight">
        {voice.status === 'TRAINING' ? 'Training...' : 'Ready'}
      </span>
    </div>
  );

  return (
    <div>
      {/* Sticky top: Search + Filter tabs */}
      <div className="sticky top-0 z-10 bg-[#0a0a1a] pb-3 space-y-3">
        {/* Search Bar (only for language filter) */}
        {!isMyClones && (
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
        )}
      </div>

      {/* Content area */}
      {isMyClones ? (
        clonedVoices.length > 0 ? (
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {clonedVoices.map(renderClonedCard)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Mic className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-sm">{t('native.createClone.clone.noClonedVoices')}</p>
            <button
              onClick={onGoToCloneTab}
              className="mt-3 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              {t('native.createClone.clone.createFirst')}
            </button>
          </div>
        )
      ) : loading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-gray-800/40 animate-pulse" />
              <div className="w-12 h-3 bg-gray-800/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : voices.length > 0 ? (
        <>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {voices.map(renderVoiceCard)}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full flex items-center justify-center gap-1.5 py-3 mt-3 text-gray-400 hover:text-white transition-colors"
            >
              {loadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Load More</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>{t('native.createClone.generate.noResults')}</p>
          <p className="text-sm mt-1">{t('native.createClone.generate.tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  );
}
