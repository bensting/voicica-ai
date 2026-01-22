'use client';

import { useEffect } from 'react';
import { VideoModel, calculateCredits } from '@/config/native/videoModels';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';

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

  const credits = calculateCredits(model, params.quality, params.duration);

  const handleCreate = () => {
    onClose();
    // Delay slightly to allow sheet animation before starting API call
    setTimeout(() => onCreateVideo(), 100);
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

        {/* 标题 */}
        <h2 className="text-white text-base font-semibold text-center mb-3">
          Parameter Settings
        </h2>

        {/* 内容区域 - 不滚动 */}
        <div className="px-5">
          {/* Quality */}
          <div className="mb-4">
            <h3 className="text-white text-sm font-medium mb-2">Quality</h3>
            <div className="flex flex-wrap gap-2">
              {model.qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateParam('quality', option.value)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    params.quality === option.value
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {option.label}
                  {option.isPro && (
                    <span className="absolute -top-1.5 -right-1 px-1 py-0.5 bg-yellow-500 text-black text-[10px] rounded font-medium">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-4">
            <h3 className="text-white text-sm font-medium mb-2">Duration</h3>
            <div className="flex flex-wrap gap-2">
              {model.durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateParam('duration', option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          <div className="mb-4">
            <h3 className="text-white text-sm font-medium mb-2">Aspect Ratio</h3>
            <div className="flex flex-wrap gap-2">
              {model.aspectRatioOptions.map((option) => {
                const IconComponent = aspectRatioIcons[option.icon];
                return (
                  <button
                    key={option.value}
                    onClick={() => updateParam('aspectRatio', option.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          <div className="mb-4">
            <h3 className="text-white text-sm font-medium mb-2">Visibility</h3>
            <div className="flex gap-2">
              <button
                onClick={() => updateParam('visibility', 'public')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  params.visibility === 'public'
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => updateParam('visibility', 'private')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          className="px-5 pt-3 pb-5"
          style={{ paddingBottom: 'calc(20px + var(--safe-area-inset-bottom, 0px))' }}
        >
          <GradientButton onClick={handleCreate}>
            <span>Create Video</span>
            <CreditsIcon className="w-3.5 h-3.5" />
            <span>{credits}</span>
          </GradientButton>
        </div>
      </div>
    </>
  );
}
