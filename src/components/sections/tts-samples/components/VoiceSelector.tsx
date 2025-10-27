import { useEffect, useRef } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import type { Voice } from '@/types/voice';
import { getLocalizedVoiceName } from '@/types/voice';

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
  /** 当前语言代码（用于显示本地化名称） */
  currentLanguage?: string;
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
  currentLanguage = 'en',
}: VoiceSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return getLocalizedVoiceName(voice, currentLanguage);
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

  // 渲染头像
  const renderAvatar = (voice: Voice) => {
    if (voice.avatar_url) {
      return (
        <img
          src={voice.avatar_url}
          alt={getDisplayName(voice)}
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
        className="w-full h-[66px] flex items-center justify-between px-4 bg-gray-800/80 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
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
            {isLoading ? 'Loading voices...' : 'Select a voice'}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 播放语音样本
                      console.log('🎵 播放语音样本:', voice.voice_sample_url);
                    }}
                  >
                    <Play className="w-4 h-4 text-white" fill="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {isOpen && !isLoading && availableVoices.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-10 p-6 text-center">
          <div className="text-gray-400 text-sm">No voices available for this language</div>
        </div>
      )}
    </div>
  );
}