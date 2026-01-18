'use client';

import { useState } from 'react';
import CreateSheet from '@/components/native/CreateSheet';
import PromptSection from '@/components/native/create/PromptSection';
import ImageGuidance from '@/components/native/create/ImageGuidance';
import ParameterSettingsSheet from '@/components/native/create/ParameterSettingsSheet';
import { VideoModel, defaultVideoModel } from '@/config/videoModels';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 下拉箭头图标
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

type ModeType = 'generate' | 'edit' | 'extend';

interface VideoParams {
  quality: '512p' | '768p' | '1080p';
  duration: '8s';
  aspectRatio: '16:9' | '9:16';
  visibility: 'public' | 'private';
}

/**
 * AI Video 创建页面
 */
export default function CreateVideoPage() {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isParamsSheetOpen, setIsParamsSheetOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<VideoModel>(defaultVideoModel);
  const [imageGuidanceTab, setImageGuidanceTab] = useState<'character' | 'keyframe'>('keyframe');
  const [params, setParams] = useState<VideoParams>({
    quality: '768p',
    duration: '8s',
    aspectRatio: '16:9',
    visibility: 'public',
  });

  const handleBack = () => {
    window.history.back();
  };

  const handleCreateVideo = () => {
    // TODO: 调用 API 创建视频
    console.log('Creating video with:', { prompt, selectedModel, params });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* 头部 */}
      <header
        className="sticky top-0 z-30 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* 返回按钮 */}
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
          >
            <BackIcon />
          </button>

          {/* AI Video 下拉 */}
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex items-center gap-1 text-white font-semibold"
          >
            <span>AI Video</span>
            <ChevronDownIcon />
          </button>

          {/* 占位 */}
          <div className="w-10" />
        </div>

        {/* 模式切换 Tabs */}
        <div className="px-4 pb-3">
          <div className="flex bg-gray-800/60 rounded-xl p-1">
            {(['generate', 'edit', 'extend'] as ModeType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                  mode === m
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {m === 'generate' ? 'Generate' : m === 'edit' ? 'Edit' : 'Extend'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto px-4 pb-32">
        {/* Prompt 区域 */}
        <PromptSection
          prompt={prompt}
          onPromptChange={setPrompt}
          selectedModel={selectedModel}
          onModelChange={(model: VideoModel) => setSelectedModel(model)}
          maxLength={2000}
        />

        {/* Image Guidance */}
        <ImageGuidance
          activeTab={imageGuidanceTab}
          onTabChange={setImageGuidanceTab}
        />

        {/* Parameters */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Parameters</h3>
            <button className="flex items-center gap-1 text-sm text-gray-400">
              <span>Credits Rule</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>

          {/* 参数显示卡片 */}
          <button
            onClick={() => setIsParamsSheetOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl"
          >
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">HD</span>
                {params.quality}
              </span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {params.duration}
              </span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                </svg>
                {params.aspectRatio}
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 底部按钮 */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleCreateVideo}
          disabled={!prompt.trim()}
          className="w-full py-4 rounded-2xl font-medium text-white bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Video
        </button>
      </div>

      {/* CreateSheet - 切换工具 */}
      <CreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      {/* Parameter Settings Sheet */}
      <ParameterSettingsSheet
        isOpen={isParamsSheetOpen}
        onClose={() => setIsParamsSheetOpen(false)}
        params={params}
        onParamsChange={setParams}
      />
    </div>
  );
}
