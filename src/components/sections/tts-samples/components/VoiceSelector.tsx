import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, Play, Pause } from 'lucide-react';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceSelectorProps {
  /** 当前选中的语音 */
  selectedVoice: Voice | null;
  /** 可用的语音列表 */
  availableVoices: Voice[];
  /** 加载状态 */
  isLoading: boolean;
  /** 语音选择回调 */
  onSelect: (voice: Voice) => void;
  /** 是否显示下拉菜单 */
  isOpen: boolean;
  /** 切换下拉菜单 */
  onToggle: () => void;
}

/**
 * 语音选择器组件
 *
 * 功能：
 * - 显示当前选中的语音（头像 + 名称 + 描述）
 * - 点击展开下拉菜单选择其他语音
 * - 支持语音试听
 * - 显示语音的角色、性别等信息
 *
 * 设计：
 * - 头像使用圆形渐变背景或真实头像
 * - 显示本地化的语音名称
 * - 隐藏滚动条保持美观
 */
export default function VoiceSelector({
  selectedVoice,
  availableVoices,
  isLoading,
  onSelect,
  isOpen,
  onToggle,
}: VoiceSelectorProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // 获取语音的显示名称
  const getDisplayName = (voice: Voice) => {
    return voice.display_name;
  };

  // 获取语音描述（角色 - 性别）
  const getVoiceDescription = (voice: Voice) => {
    const parts = [];
    if (voice.gender) {
      parts.push(voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1));
    }
    if (voice.role) {
      parts.push(voice.role);
    }
    return parts.join(' - ');
  };

  // 播放语音样本
  const handlePlaySample = (voice: Voice, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!voice.voice_sample_url) return;

    // 如果正在播放同一个语音，则暂停
    if (playingVoiceId === voice.id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 创建新的音频对象并播放
    const audio = new Audio(voice.voice_sample_url);
    audioRef.current = audio;
    setPlayingVoiceId(voice.id || null);

    audio.play().catch((error) => {
      console.error('播放失败:', error);
      setPlayingVoiceId(null);
    });

    // 播放结束后重置状态
    audio.onended = () => {
      setPlayingVoiceId(null);
    };
  };

  // 处理解锁 CTA 点击
  const handleUnlockClick = () => {
    router.push('/studio/tts');
  };

  // 当可用语音列表变化时（语言切换），停止播放并重置状态
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  }, [availableVoices]);

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 渲染头像
  const renderAvatar = (voice: Voice) => {
    if (voice.avatar_url) {
      return (
        <Image
          src={voice.avatar_url}
          alt={getDisplayName(voice)}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    // 如果没有头像，使用渐变背景
    return <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />;
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* 选择按钮 */}
      <button
        onClick={onToggle}
        className="w-full h-[66px] flex items-center justify-between px-4 bg-gray-900/90 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
        disabled={isLoading}
      >
        {selectedVoice ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {renderAvatar(selectedVoice)}
            <div className="text-left flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {getDisplayName(selectedVoice)}
              </div>
              <div className="text-xs text-gray-400 truncate">{getVoiceDescription(selectedVoice)}</div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">
            {isLoading ? t('ttsSamples.voiceSelector.loading') : t('ttsSamples.voiceSelector.placeholder')}
          </span>
        )}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && !isLoading && availableVoices.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
          {/* 语音列表 - 隐藏滚动条 */}
          <div
            className="max-h-80 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {availableVoices.map((voice) => (
              <div
                key={voice.id || voice.name}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors cursor-pointer ${
                  selectedVoice?.id === voice.id ? 'bg-gray-700' : ''
                }`}
                onClick={() => {
                  onSelect(voice);
                  onToggle();
                }}
              >
                {renderAvatar(voice)}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {getDisplayName(voice)}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{getVoiceDescription(voice)}</div>
                </div>
                {/* 试听按钮 */}
                {voice.voice_sample_url && (
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-purple-600 rounded-full transition-colors flex-shrink-0"
                    onClick={(e) => handlePlaySample(voice, e)}
                  >
                    {playingVoiceId === voice.id ? (
                      <Pause className="w-4 h-4 text-white" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 解锁更多语音 CTA */}
          <div
            onClick={handleUnlockClick}
            className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-center cursor-pointer hover:from-purple-500 hover:to-purple-600 transition-all"
          >
            <div className="text-white font-bold text-sm mb-1">{t('ttsSamples.voiceSelector.unlockTitle')}</div>
            <div className="text-purple-100 text-xs">{t('ttsSamples.voiceSelector.unlockSubtitle')}</div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {isOpen && !isLoading && availableVoices.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-10 p-6 text-center">
          <div className="text-gray-400 text-sm">{t('ttsSamples.voiceSelector.noVoices')}</div>
        </div>
      )}
    </div>
  );
}