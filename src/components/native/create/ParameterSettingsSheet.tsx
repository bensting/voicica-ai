'use client';

import { useEffect } from 'react';

interface VideoParams {
  quality: '512p' | '768p' | '1080p';
  duration: '8s';
  aspectRatio: '16:9' | '9:16';
  visibility: 'public' | 'private';
}

interface ParameterSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  params: VideoParams;
  onParamsChange: (params: VideoParams) => void;
}

// 横屏图标
const LandscapeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
  </svg>
);

// 竖屏图标
const PortraitIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="2" width="14" height="20" rx="2" />
  </svg>
);

/**
 * Parameter Settings 底部弹出 Sheet
 */
export default function ParameterSettingsSheet({
  isOpen,
  onClose,
  params,
  onParamsChange,
}: ParameterSettingsSheetProps) {
  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const updateParam = <K extends keyof VideoParams>(key: K, value: VideoParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet 内容 */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 pb-6">
          {/* 标题 */}
          <h2 className="text-white text-lg font-semibold text-center mb-6">
            Parameter Settings
          </h2>

          {/* Quality */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Quality</h3>
            <div className="flex gap-3">
              {(['512p', '768p', '1080p'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => updateParam('quality', quality)}
                  className={`flex-1 relative py-3 rounded-xl text-sm font-medium transition-colors ${
                    params.quality === quality
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {quality}
                  {quality === '1080p' && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-medium">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Duration</h3>
            <div className="flex gap-3">
              <button
                className="px-6 py-3 rounded-xl text-sm font-medium bg-gray-700 text-white border border-gray-600"
              >
                8s
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Aspect Ratio</h3>
            <div className="flex gap-3">
              <button
                onClick={() => updateParam('aspectRatio', '16:9')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                  params.aspectRatio === '16:9'
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                }`}
              >
                <LandscapeIcon />
                <span>16:9</span>
              </button>
              <button
                onClick={() => updateParam('aspectRatio', '9:16')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                  params.aspectRatio === '9:16'
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                }`}
              >
                <PortraitIcon />
                <span>9:16</span>
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div className="mb-8">
            <h3 className="text-white font-medium mb-3">Visibility</h3>
            <div className="flex gap-3">
              <button
                onClick={() => updateParam('visibility', 'public')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  params.visibility === 'public'
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => updateParam('visibility', 'private')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  params.visibility === 'private'
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Create Video Button */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-medium text-gray-400 bg-gray-700"
            style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
          >
            Create Video
          </button>
        </div>
      </div>
    </>
  );
}
