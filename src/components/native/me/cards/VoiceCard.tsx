'use client';

import type { TtsRecord } from '@/actions/tts';
import { formatTime } from '../utils';

interface VoiceCardProps {
  voice: TtsRecord;
  onClick: () => void;
}

export default function VoiceCard({ voice, onClick }: VoiceCardProps) {
  const isProcessing = voice.status === 'PENDING' || voice.status === 'PROCESSING';
  const isSuccess = voice.status === 'SUCCESS';
  const isFailed = voice.status === 'FAILURE';

  const displayTitle = voice.text?.substring(0, 30) || 'Voice Audio';
  const displaySubtitle = voice.voice_name || '';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 图标 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {isProcessing && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[9px] font-medium">{voice.progress}%</span>
          </div>
        )}
        {isFailed && (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        )}
        {!isProcessing && !isFailed && !isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
        {/* 时长标签 */}
        {isSuccess && voice.duration && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{formatTime(voice.duration)}</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        {displaySubtitle && (
          <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
        )}
      </div>
    </button>
  );
}
