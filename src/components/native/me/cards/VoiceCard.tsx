'use client';

import type { TtsRecord } from '@/actions/tts';
import { formatTime } from '../utils';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';
import { User, UserRound, Users } from 'lucide-react';

interface VoiceCardProps {
  voice: TtsRecord;
  onClick: () => void;
}

export default function VoiceCard({ voice, onClick }: VoiceCardProps) {
  const isProcessing = voice.status === 'PENDING' || voice.status === 'PROCESSING';
  const isSuccess = voice.status === 'SUCCESS';
  const isFailed = voice.status === 'FAILURE';

  // 使用关联的语音信息
  const voiceInfo = voice.voice;
  const displayName = voiceInfo?.display_name || voice.voice_name;
  const displayText = voice.text?.substring(0, 50) || 'Voice Audio';

  // 性别图标
  const GenderIcon = () => {
    if (!voiceInfo?.gender) return null;
    if (voiceInfo.gender === 'male') return <User className="w-3 h-3 text-blue-400" />;
    if (voiceInfo.gender === 'female') return <UserRound className="w-3 h-3 text-pink-400" />;
    return <Users className="w-3 h-3 text-gray-400" />;
  };

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 头像 */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
        {isProcessing ? (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-purple-900 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[9px] font-medium">{voice.progress}%</span>
          </div>
        ) : isFailed ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        ) : voiceInfo?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voiceInfo.avatar_url}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-purple-900 flex items-center justify-center text-white text-lg font-medium">
            {displayName.charAt(0)}
          </div>
        )}

        {/* 时长标签 */}
        {isSuccess && voice.duration && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{formatTime(voice.duration)}</span>
          </div>
        )}

        {/* 处理中状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        {/* 生成的文本 */}
        <h4 className="text-white font-medium text-base truncate">{displayText}</h4>

        {/* 语音信息行：voice_name · gender · provider */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
          <span className="truncate max-w-[140px]">{voice.voice_name}</span>
          {voiceInfo && (
            <>
              <span>·</span>
              <GenderIcon />
              <span>·</span>
              <ProviderIcon provider={voiceInfo.provider.toLowerCase()} className="w-3.5 h-3.5" />
            </>
          )}
        </div>
      </div>
    </button>
  );
}
