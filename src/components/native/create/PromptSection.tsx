'use client';

import { useState } from 'react';
import { VideoModel, videoModels } from '@/config/videoModels';
import ModelSelectorSheet from './ModelSelectorSheet';

interface PromptSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: VideoModel;
  onModelChange: (model: VideoModel) => void;
  maxLength: number;
}

// Google 图标（小）
const GoogleIconSmall = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// 其他小图标
const OpenAIIconSmall = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
  </svg>
);

// 图标映射（小）
const smallIconMap: Record<string, React.FC> = {
  google: GoogleIconSmall,
  openai: OpenAIIconSmall,
};

// 下拉箭头
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// AI 助手图标
const AssistantIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#3B82F6" />
    <circle cx="8" cy="10" r="1.5" fill="white" />
    <circle cx="16" cy="10" r="1.5" fill="white" />
    <path d="M8 14c0 2 2 3 4 3s4-1 4-3" stroke="white" strokeWidth="1.5" fill="none" />
  </svg>
);

// 删除图标
const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

/**
 * Prompt 输入区域组件
 */
export default function PromptSection({
  prompt,
  onPromptChange,
  selectedModel,
  onModelChange,
  maxLength,
}: PromptSectionProps) {
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);

  const handleClear = () => {
    onPromptChange('');
  };

  const SmallIcon = smallIconMap[selectedModel.icon] || GoogleIconSmall;

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Prompt</h3>

        {/* Model Selector Button */}
        <button
          onClick={() => setIsModelSheetOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-300"
        >
          <SmallIcon />
          <span>{selectedModel.name}</span>
          <ChevronDownIcon />
        </button>
      </div>

      {/* Text Area Card */}
      <div className="bg-gray-800/60 rounded-2xl p-4">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, maxLength))}
          placeholder="Please enter the prompt for generation. For example: Under the sunlight, a breeze gently sways the flowers, with a cinematic feel."
          className="w-full h-32 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed"
        />

        {/* Bottom Bar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
          {/* Assistant Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/60 rounded-full text-sm text-gray-300 hover:bg-gray-600/60 transition-colors">
            <AssistantIcon />
            <span>Assistant</span>
          </button>

          {/* Character Count & Clear */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {prompt.length}/{maxLength}
            </span>
            <div className="w-px h-4 bg-gray-700" />
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Sheet */}
      <ModelSelectorSheet
        isOpen={isModelSheetOpen}
        onClose={() => setIsModelSheetOpen(false)}
        selectedModelId={selectedModel.id}
        onSelect={onModelChange}
      />
    </div>
  );
}
