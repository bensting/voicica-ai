'use client';

import type { MusicRecord } from '@/actions/music';

interface MusicCardProps {
  music: MusicRecord;
  onClick: () => void;
}

export default function MusicCard({ music, onClick }: MusicCardProps) {
  const isProcessing = music.status === 'PENDING' || music.status === 'PROCESSING';
  const isSuccess = music.status === 'SUCCESS';
  const isFailed = music.status === 'FAILURE';

  const displayTitle = music.title || 'AI Music';
  const displaySubtitle = music.prompt?.substring(0, 30) || '';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 封面图 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden">
        {isSuccess && music.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={music.cover_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[9px] font-medium">{music.progress}%</span>
              </div>
            )}
            {isFailed && (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {!isProcessing && !isFailed && (
              <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
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
