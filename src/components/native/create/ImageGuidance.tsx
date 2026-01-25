'use client';

import { useState } from 'react';
import { ImageGuidanceConfig } from '@/config/native/videoModels';

interface ImageGuidanceProps {
  config?: ImageGuidanceConfig;
  startFrame: string | null;
  endFrame: string | null;
  onStartFrameChange: (image: string | null) => void;
  onEndFrameChange: (image: string | null) => void;
  /** 多图模式下的图片数组 */
  images?: string[];
  /** 多图模式下的图片变更回调 */
  onImagesChange?: (images: string[]) => void;
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
 * - multi: 多图参考模式（支持多张图片）
 */
export default function ImageGuidance({
  config,
  startFrame,
  endFrame,
  onStartFrameChange,
  onEndFrameChange,
  images = [],
  onImagesChange,
}: ImageGuidanceProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // 如果未启用图片引导，不显示
  if (!config?.enabled) {
    return null;
  }

  const maxImages = config.maxImages || 2;
  const isMultiMode = config.mode === 'multi';
  const isStartEndMode = config.mode === 'startEnd';

  const handleImageUpload = (type: 'start' | 'end' | 'multi', index?: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, JPEG, PNG, or WebP image.');
        return;
      }

      // Validate file size (10 MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size must be less than 10 MB.');
        return;
      }

      // Read as base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'multi' && onImagesChange) {
          const newImages = [...images, result];
          onImagesChange(newImages);
        } else if (type === 'start') {
          onStartFrameChange(result);
        } else if (type === 'end') {
          onEndFrameChange(result);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleRemoveImage = (type: 'start' | 'end' | 'multi', index?: number) => {
    if (type === 'multi' && onImagesChange && index !== undefined) {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } else if (type === 'start') {
      onStartFrameChange(null);
    } else if (type === 'end') {
      onEndFrameChange(null);
    }
  };

  // 多图模式 UI
  if (isMultiMode) {
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
            {showTooltip && (
              <div className="absolute right-0 top-6 z-50 w-56 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Upload 0-{maxImages} images. Supports JPG/PNG/WebP, up to 10 MB each.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Images - 横向排列 */}
        <div className="flex gap-3 flex-wrap">
          {/* 已上传的图片 */}
          {images.map((img, index) => (
            <div key={index} className="relative w-28 h-28 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Reference ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage('multi', index)}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <CloseIcon />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                {index + 1}/{maxImages}
              </span>
            </div>
          ))}

          {/* 添加更多按钮 */}
          {images.length < maxImages && (
            <button
              onClick={() => handleImageUpload('multi')}
              className="w-28 h-28 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
            >
              <PlusIcon />
              <span className="text-xs">Upload</span>
            </button>
          )}
        </div>

        {/* 说明文字 */}
        <p className="text-xs text-gray-500 mt-2">
          Upload 0-{maxImages} images. Leave empty to generate video from text only.
        </p>
      </div>
    );
  }

  // 单图 / 首尾帧模式 UI (保持原有逻辑)
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
            <div className="absolute right-0 top-6 z-50 w-56 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
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
