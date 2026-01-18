'use client';

import { useEffect } from 'react';
import { VideoModel, calculateCredits } from '@/config/native/videoModels';

interface VideoParams {
  quality: string;
  duration: string;
  aspectRatio: string;
  visibility: 'public' | 'private';
}

interface ParameterSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  model: VideoModel;
  params: VideoParams;
  onParamsChange: (params: VideoParams) => void;
  onCreateVideo: () => void;
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

// 方形图标
const SquareIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

// 经典比例图标 (4:3)
const ClassicIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </svg>
);

// 星星图标
const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
  </svg>
);

// 图标映射
const aspectRatioIcons: Record<string, React.FC> = {
  landscape: LandscapeIcon,
  portrait: PortraitIcon,
  square: SquareIcon,
  classic: ClassicIcon,
};

/**
 * Parameter Settings 底部弹出 Sheet
 */
export default function ParameterSettingsSheet({
  isOpen,
  onClose,
  model,
  params,
  onParamsChange,
  onCreateVideo,
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

  const credits = calculateCredits(model, params.quality);

  const handleCreate = () => {
    onCreateVideo();
    onClose();
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet 内容 */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up max-h-[85vh] overflow-hidden flex flex-col">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* 标题 */}
        <h2 className="text-white text-lg font-semibold text-center mb-4 flex-shrink-0">
          Parameter Settings
        </h2>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-auto px-6">
          {/* Quality */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Quality</h3>
            <div className="flex flex-wrap gap-3">
              {model.qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateParam('quality', option.value)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                    params.quality === option.value
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {option.label}
                  {option.isPro && (
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
            <div className="flex flex-wrap gap-3">
              {model.durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateParam('duration', option.value)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                    params.duration === option.value
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Aspect Ratio</h3>
            <div className="flex flex-wrap gap-3">
              {model.aspectRatioOptions.map((option) => {
                const IconComponent = aspectRatioIcons[option.icon];
                return (
                  <button
                    key={option.value}
                    onClick={() => updateParam('aspectRatio', option.value)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                      params.aspectRatio === option.value
                        ? 'bg-gray-700 text-white border border-gray-600'
                        : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {IconComponent && <IconComponent />}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility */}
          <div className="mb-6">
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
        </div>

        {/* Create Video Button */}
        <div
          className="flex-shrink-0 px-6 pt-4 pb-6"
          style={{ paddingBottom: 'calc(24px + var(--safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={handleCreate}
            className="w-full py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center gap-2"
          >
            <span>Create Video</span>
            <StarIcon />
            <span>{credits}</span>
          </button>
        </div>
      </div>
    </>
  );
}
