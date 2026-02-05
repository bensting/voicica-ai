'use client';

import { useState, useRef } from 'react';
import { DIALOGUE_ALL_VOICES, getVoiceSampleUrl } from '@/config/native/dialogueConfig';
import { useLanguage } from '@/contexts/LanguageContext';

interface DialogueVoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
}

// 搜索图标
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// 播放图标
const PlayIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 停止图标
const StopIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

/**
 * Dialogue 声音选择器 - 底部弹出
 */
export default function DialogueVoiceSheet({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelect,
}: DialogueVoiceSheetProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  // 过滤声音
  const filteredVoices = DIALOGUE_ALL_VOICES.filter((voice) => {
    // 性别过滤
    if (genderFilter !== 'all' && voice.gender !== genderFilter) {
      return false;
    }
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return voice.name.toLowerCase().includes(query) || voice.id.toLowerCase().includes(query);
    }
    return true;
  });

  const handleSelect = (voiceId: string) => {
    onSelect(voiceId);
    onClose();
    setSearchQuery('');
    // 停止播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    // 停止播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
    }
  };

  // 播放/停止预览
  const togglePlay = (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();

    // 如果正在播放这个声音，停止
    if (playingVoiceId === voiceId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 开始新的播放
    const url = getVoiceSampleUrl(voiceId);
    const audio = new Audio(url);
    audio.onended = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.play();
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[10000]"
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-gray-900 rounded-t-2xl animate-slide-up flex flex-col"
        style={{
          maxHeight: '80vh',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full">
              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{t('native.createDialogue.voice')}</h3>
              <p className="text-gray-400 text-sm">{t('native.createDialogue.selectVoice')}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('native.createDialogue.searchVoice')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <SearchIcon />
            </div>
          </div>

          {/* Gender Filter */}
          <div className="flex gap-2">
            {(['all', 'male', 'female'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  genderFilter === gender
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {gender === 'all' ? t('native.createDialogue.genderFilter.all') : gender === 'male' ? `♂ ${t('native.createDialogue.genderFilter.male')}` : `♀ ${t('native.createDialogue.genderFilter.female')}`}
              </button>
            ))}
          </div>
        </div>

        {/* Voice List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredVoices.map((voice) => (
              <div
                key={voice.id}
                onClick={() => handleSelect(voice.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                  selectedVoiceId === voice.id
                    ? 'bg-purple-500/20 border border-purple-500'
                    : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Gender Icon */}
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className={`text-sm ${voice.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>
                      {voice.gender === 'male' ? '♂' : '♀'}
                    </span>
                  </div>
                  {/* Name */}
                  <span className={`text-sm ${selectedVoiceId === voice.id ? 'text-purple-400 font-medium' : 'text-white'}`}>
                    {voice.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Play Button */}
                  <button
                    onClick={(e) => togglePlay(e, voice.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      playingVoiceId === voice.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    {playingVoiceId === voice.id ? <StopIcon /> : <PlayIcon />}
                  </button>

                  {/* Check Icon */}
                  {selectedVoiceId === voice.id && (
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}

            {filteredVoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No voices found
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
