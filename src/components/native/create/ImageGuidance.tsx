'use client';

import { useState } from 'react';

type TabType = 'character' | 'keyframe';

interface ImageGuidanceProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
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
 * 支持 Character Reference 和 Key Frame 两种模式
 */
export default function ImageGuidance({ activeTab, onTabChange }: ImageGuidanceProps) {
  const [startFrameImage, setStartFrameImage] = useState<string | null>(null);
  const [characterImage, setCharacterImage] = useState<string | null>(null);

  const handleImageUpload = (type: 'start' | 'character') => {
    // 创建文件输入
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (type === 'start') {
            setStartFrameImage(result);
          } else {
            setCharacterImage(result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemoveImage = (type: 'start' | 'character') => {
    if (type === 'start') {
      setStartFrameImage(null);
    } else {
      setCharacterImage(null);
    }
  };

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-white font-semibold">Image Guidance (optional)</h3>
        <button className="text-yellow-500">
          <InfoIcon />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800/60 rounded-xl p-1 mb-4">
        <button
          onClick={() => onTabChange('character')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'character'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Character Reference
        </button>
        <button
          onClick={() => onTabChange('keyframe')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'keyframe'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Key Frame
        </button>
      </div>

      {/* Upload Area */}
      {activeTab === 'keyframe' ? (
        <div className="flex gap-3">
          {/* Start Frame */}
          {startFrameImage ? (
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden">
              <img
                src={startFrameImage}
                alt="Start frame"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage('start')}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <CloseIcon />
              </button>
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                Start frame
              </span>
            </div>
          ) : (
            <button
              onClick={() => handleImageUpload('start')}
              className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
            >
              <PlusIcon />
              <span className="text-sm">Start frame</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Character Reference */}
          {characterImage ? (
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden">
              <img
                src={characterImage}
                alt="Character reference"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage('character')}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleImageUpload('character')}
              className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
            >
              <PlusIcon />
              <span className="text-sm">Upload</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
