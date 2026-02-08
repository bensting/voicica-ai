'use client';

import CreditsIcon from './CreditsIcon';
import CrownIcon from './CrownIcon';

export type GeneratingStatus = 'generating' | 'loading' | 'success' | 'error';
export type GeneratingType = 'music' | 'image' | 'video' | 'voice' | 'download';

interface GeneratingModalProps {
  isOpen: boolean;
  status: GeneratingStatus;
  type: GeneratingType;
  progress?: number;
  error?: string | null;
  credits?: number;
  onClose: () => void;
  onCreateAnother: () => void;
  onTryAgain: () => void;
  /** 是否显示看广告提示（非订阅用户） */
  showAdPrompt?: boolean;
  /** 广告是否已观看完成 */
  adWatched?: boolean;
}

// 图标组件
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 类型配置
const typeConfig: Record<GeneratingType, {
  generatingTitle: string;
  generatingIcon: React.ReactNode;
  successTitle: string;
  successMessage: string;
  estimatedTime: string;
}> = {
  music: {
    generatingTitle: 'Generating music...',
    generatingIcon: (
      <svg className="w-8 h-8 text-gray-400 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    successTitle: 'Music Created!',
    successMessage: 'Your music has been generated successfully.',
    estimatedTime: '3 minutes',
  },
  image: {
    generatingTitle: 'Creating AI Image...',
    generatingIcon: <div className="text-gray-400 animate-pulse text-2xl">🖼️</div>,
    successTitle: 'Image Created!',
    successMessage: 'Your AI image has been generated.',
    estimatedTime: '30-60 seconds',
  },
  video: {
    generatingTitle: 'Creating AI Video...',
    generatingIcon: (
      <svg className="w-8 h-8 text-gray-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
      </svg>
    ),
    successTitle: 'Video Created!',
    successMessage: 'Your AI video has been generated.',
    estimatedTime: '2-5 minutes',
  },
  voice: {
    generatingTitle: 'Generating your audio...',
    generatingIcon: (
      <svg className="w-8 h-8 text-gray-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    successTitle: 'Voice Created!',
    successMessage: 'Your AI voice has been generated.',
    estimatedTime: '10-30 seconds',
  },
  download: {
    generatingTitle: 'Parsing video...',
    generatingIcon: (
      <svg className="w-8 h-8 text-gray-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    successTitle: 'Video Found!',
    successMessage: 'Video parsed successfully.',
    estimatedTime: '10-30 seconds',
  },
};

export default function GeneratingModal({
  isOpen,
  status,
  type,
  progress = 0,
  error,
  credits = 0,
  onClose,
  onCreateAnother,
  onTryAgain,
  showAdPrompt = false,
  adWatched = false,
}: GeneratingModalProps) {
  if (!isOpen) return null;

  const config = typeConfig[type];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col"
      style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={onClose} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <div className="flex items-center gap-1 text-white">
          <CreditsIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{credits}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Generating */}
        {status === 'generating' && (
          <>
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                  {config.generatingIcon}
                </div>
              </div>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{config.generatingTitle}</h3>
            {progress > 0 && (
              <p className="text-blue-400 text-sm mb-2">{progress}%</p>
            )}
            <p className="text-gray-400 text-sm mb-8">
              Estimated time: <span className="text-blue-400">{config.estimatedTime}</span>
            </p>

            {/* 非订阅用户的广告提示（可爱风格） */}
            {showAdPrompt && !adWatched && (
              <div className="mb-6 text-center">
                <p className="text-gray-300 text-sm">
                  Hey sweetie, don&apos;t just wait around~
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  A short ad is coming to keep you company
                </p>
              </div>
            )}

            {/* 广告已观看完成提示 */}
            {showAdPrompt && adWatched && (
              <div className="mb-6 text-center">
                <p className="text-green-400 text-sm flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Thanks for watching!
                </p>
              </div>
            )}

            {/* 订阅用户的快速通道按钮 */}
            {!showAdPrompt && (
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                <CrownIcon className="w-4 h-4" />
                <span>Use fast channel</span>
              </button>
            )}
          </>
        )}

        {/* Loading (fetching result) */}
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{config.successTitle}</h3>
            <p className="text-gray-400 text-sm mb-4">Loading your {type}...</p>
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </>
        )}

        {/* Success (fallback if detail modal fails) */}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{config.successTitle}</h3>
            <p className="text-gray-400 text-sm mb-8">{config.successMessage}</p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={onCreateAnother}
                className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
              >
                Create Another
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Generation Failed</h3>
            <p className="text-red-400 text-sm mb-8 text-center px-4">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onTryAgain}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
