'use client';

import { useState, useRef, useEffect } from 'react';
import { VideoModel } from '@/config/native/videoModels';
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

// OpenAI 图标（小）
const OpenAIIconSmall = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
  </svg>
);

// Vidu 图标（小）
const ViduIconSmall = () => (
  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 12l3 3 5-6" />
  </svg>
);

// Pixverse 图标（小）
const PixverseIconSmall = () => (
  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
  </svg>
);

// Wan 图标（小）
const WanIconSmall = () => (
  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// Kling 图标（小）
const KlingIconSmall = () => (
  <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

// Seedance 图标（小）
const SeedanceIconSmall = () => (
  <svg className="w-4 h-4" viewBox="0 0 384 384" fill="white">
    <rect x="30" y="95" width="55" height="250" />
    <rect x="110" y="150" width="55" height="195" />
    <rect x="200" y="35" width="55" height="310" />
    <rect x="295" y="95" width="55" height="250" />
  </svg>
);

// 图标映射（小）
const smallIconMap: Record<string, React.FC> = {
  google: GoogleIconSmall,
  openai: OpenAIIconSmall,
  vidu: ViduIconSmall,
  pixverse: PixverseIconSmall,
  wan: WanIconSmall,
  kling: KlingIconSmall,
  seedance: SeedanceIconSmall,
};

// 下拉箭头
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// 魔法棒图标
const MagicWandIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5" />
    <path d="M3 21l9-9" strokeLinecap="round" />
  </svg>
);

// 删除图标
const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

// Loading 图标
const LoadingSpinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// 关闭图标
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
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
  const [isGenerateSheetOpen, setIsGenerateSheetOpen] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when sheet opens
  useEffect(() => {
    if (isGenerateSheetOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isGenerateSheetOpen]);

  const handleClear = () => {
    onPromptChange('');
  };

  const handleGeneratePrompt = async () => {
    if (!generateInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/ai/generate-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generateInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      // Set the generated prompt
      onPromptChange(data.prompt.slice(0, maxLength));
      // Close the sheet (keep input for next time)
      setIsGenerateSheetOpen(false);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
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
          {/* Generate Prompt Button */}
          <button
            onClick={() => setIsGenerateSheetOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-700/60 rounded-full text-xs text-gray-300 hover:bg-gray-600/60 transition-colors"
          >
            <MagicWandIcon />
            <span>Generate Prompt</span>
          </button>

          {/* Character Count & Clear */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {prompt.length}/{maxLength}
            </span>
            <div className="w-px h-3.5 bg-gray-700" />
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

      {/* Generate Prompt Sheet */}
      {isGenerateSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isGenerating && setIsGenerateSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-lg bg-[#1a1a2e] rounded-t-3xl animate-slide-up"
            style={{ paddingBottom: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h3 className="text-lg font-semibold text-white">Generate Prompt</h3>
              <button
                onClick={() => !isGenerating && setIsGenerateSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                disabled={isGenerating}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-400 mb-3">
                Describe what you want to create, and AI will generate a detailed prompt for you.
              </p>

              {/* Input */}
              <textarea
                ref={inputRef}
                value={generateInput}
                onChange={(e) => setGenerateInput(e.target.value.slice(0, 500))}
                placeholder="e.g., A cat playing piano in a jazz bar"
                className="w-full h-24 p-3 bg-gray-800/60 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                disabled={isGenerating}
              />

              {/* Character count */}
              <div className="flex justify-end mt-1 mb-3">
                <span className="text-xs text-gray-500">{generateInput.length}/500</span>
              </div>

              {/* Error */}
              {generateError && (
                <div className="mb-3 p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
                  {generateError}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGeneratePrompt}
                disabled={!generateInput.trim() || isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <MagicWandIcon className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
