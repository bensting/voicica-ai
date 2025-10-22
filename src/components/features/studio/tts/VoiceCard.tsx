import Image from 'next/image';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { getCountryFromLocale } from './utils/localeUtils';
import { getCountryFlagComponent } from './utils/countryUtils';

interface VoiceCardProps {
  voice: VoiceModel;
  isSelected: boolean;
  isPlaying: boolean;
  disabled?: boolean;
  onSelect: (voice: VoiceModel) => void;
  onPlayPause: (voice: VoiceModel, e: React.MouseEvent) => void;
}

/**
 * 语音卡片组件
 */
export default function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  disabled = false,
  onSelect,
  onPlayPause,
}: VoiceCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onSelect(voice)}
    >
      {/* 顶部：头像和播放按钮 */}
      <div className="flex items-center justify-between">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
          {voice.avatar_url ? (
            <Image
              src={voice.avatar_url}
              alt={voice.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-white">🎤</span>
          )}
        </div>

        {/* 播放/暂停按钮 */}
        <button
          onClick={(e) => onPlayPause(voice, e)}
          disabled={disabled || !voice.voice_sample_url}
          className="w-10 h-10 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            // 暂停图标
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            // 播放图标
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* 信息区域 */}
      <div className="flex-1 space-y-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {voice.display_name?.en || voice.name}
          </h3>
          <p className="text-xs text-gray-600">
            {voice.role} • {voice.locale}
          </p>
        </div>

        {/* 标签 */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded flex items-center gap-1">
            <span className="w-4 h-3 inline-flex">
              {(() => {
                const FlagComponent = getCountryFlagComponent(getCountryFromLocale(voice.locale));
                return FlagComponent ? <FlagComponent className="w-5 h-4" /> : null;
              })()}
            </span>
            <span>{getCountryFromLocale(voice.locale)}</span>
          </span>
          {voice.gender && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              {voice.gender}
            </span>
          )}
        </div>

        {/* 风格列表 */}
        {voice.style_list.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {voice.style_list.slice(0, 2).map((style, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
              >
                {style}
              </span>
            ))}
            {voice.style_list.length > 2 && (
              <span className="text-xs text-gray-500">
                +{voice.style_list.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
