'use client';

import { useState } from 'react';
import { ImageGuidanceConfig } from '@/config/native/videoModels';

interface ImageGuidanceProps {
  config?: ImageGuidanceConfig;
  startFrame: string | null;
  endFrame: string | null;
  onStartFrameChange: (image: string | null) => void;
  onEndFrameChange: (image: string | null) => void;
}

// 信息图标
const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

// 加号图标
const PlusIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// 关闭图标
const CloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/**
 * Image Guidance 组件
 * 根据模型配置显示不同的图片上传 UI
 * - single: 单图模式（显示一个上传框）
 * - startEnd: 首尾帧模式（显示 Start Frame + End Frame）
 */
export default function ImageGuidance({
  config,
  startFrame,
  endFrame,
  onStartFrameChange,
  onEndFrameChange,
}: ImageGuidanceProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // 如果未启用图片引导，不显示
  if (!config?.enabled) {
    return null;
  }

  const handleImageUpload = (type: 'start' | 'end') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, JPEG, or PNG image.');
        return;
      }

      // Validate file size (10 MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size must be less than 10 MB.');
        return;
      }

      // Validate image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          alert('Image width and height must be at least 300px.');
          return;
        }

        // Read as base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (type === 'start') {
            onStartFrameChange(result);
          } else {
            onEndFrameChange(result);
          }
        };
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        alert('Failed to load image. Please try another file.');
      };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  };

  const handleRemoveImage = (type: 'start' | 'end') => {
    if (type === 'start') {
      onStartFrameChange(null);
    } else {
      onEndFrameChange(null);
    }
  };

  const isStartEndMode = config.mode === 'startEnd';

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-white font-semibold">Image Guidance (optional)</h3>
        <div className="relative">
          <button
            className="text-gray-500 hover:text-gray-400"
            onClick={() => setShowTooltip(!showTooltip)}
            onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
          >
            <InfoIcon />
          </button>
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute left-0 top-6 z-50 w-56 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                Supports JPG/JPEG/PNG, up to 10 MB. Minimum width/height is 300px.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div className="flex gap-3">
        {/* Start Frame / Single Image */}
        {startFrame ? (
          <div className="relative w-28 h-28 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={startFrame}
              alt="Start frame"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemoveImage('start')}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
            >
              <CloseIcon />
            </button>
            <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
              {isStartEndMode ? 'Start frame' : 'Reference'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => handleImageUpload('start')}
            className="w-28 h-28 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
          >
            <PlusIcon />
            <span className="text-xs">{isStartEndMode ? 'Start frame' : 'Upload'}</span>
          </button>
        )}

        {/* End Frame (仅首尾帧模式) */}
        {isStartEndMode && (
          <>
            {endFrame ? (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={endFrame}
                  alt="End frame"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage('end')}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                >
                  <CloseIcon />
                </button>
                <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                  End frame
                </span>
              </div>
            ) : (
              <button
                onClick={() => handleImageUpload('end')}
                className="w-28 h-28 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
              >
                <PlusIcon />
                <span className="text-xs">End frame</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
