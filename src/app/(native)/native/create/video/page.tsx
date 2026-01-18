'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateSheet from '@/components/native/CreateSheet';
import PromptSection from '@/components/native/create/PromptSection';
import ImageGuidance from '@/components/native/create/ImageGuidance';
import ParameterSettingsSheet from '@/components/native/create/ParameterSettingsSheet';
import { VideoModel, defaultVideoModel, getModelDefaults, calculateCredits } from '@/config/native/videoModels';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

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

// 时钟图标
const ClockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

// 屏幕图标
const ScreenIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </svg>
);

// 展开图标
const ChevronUpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

type ModeType = 'generate' | 'edit' | 'extend';

interface VideoParams {
  quality: string;
  duration: string;
  aspectRatio: string;
  visibility: 'public' | 'private';
}

// Loading 图标
const LoadingIcon = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * AI Video 创建页面
 */
export default function CreateVideoPage() {
  const router = useRouter();
  const { token, user } = useFirebaseAuth();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isParamsSheetOpen, setIsParamsSheetOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<VideoModel>(defaultVideoModel);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<VideoParams>(() => {
    const defaults = getModelDefaults(defaultVideoModel);
    return {
      ...defaults,
      visibility: 'public',
    };
  });

  // 当模型变化时，重置参数为新模型的默认值，并清空图片
  useEffect(() => {
    const defaults = getModelDefaults(selectedModel);
    setParams((prev) => ({
      ...defaults,
      visibility: prev.visibility, // 保留 visibility 设置
    }));
    // 切换模型时清空已上传的图片
    setStartFrame(null);
    setEndFrame(null);
  }, [selectedModel]);

  const handleBack = () => {
    window.history.back();
  };

  const handleModelChange = (model: VideoModel) => {
    setSelectedModel(model);
  };

  const handleCreateVideo = async () => {
    if (!prompt.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/native/video/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelId: selectedModel.id,
          quality: params.quality,
          duration: params.duration,
          aspectRatio: params.aspectRatio,
          visibility: params.visibility,
          startFrame: startFrame || undefined,
          endFrame: endFrame || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please login to create videos');
          return;
        }
        if (response.status === 402) {
          setError(`Insufficient credits. Need ${data.required}, have ${data.available}`);
          return;
        }
        throw new Error(data.error || 'Failed to create video');
      }

      // 成功，跳转到任务详情页
      console.log('Video task created:', data.taskId);
      router.push(`/native/video/task/${data.taskId}`);
    } catch (err) {
      console.error('Create video error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create video');
    } finally {
      setIsCreating(false);
    }
  };

  const credits = calculateCredits(selectedModel, params.quality, params.duration);

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
          onModelChange={handleModelChange}
          maxLength={2000}
        />

        {/* Image Guidance */}
        <ImageGuidance
          config={selectedModel.imageGuidance}
          startFrame={startFrame}
          endFrame={endFrame}
          onStartFrameChange={setStartFrame}
          onEndFrameChange={setEndFrame}
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
                <ClockIcon />
                {params.duration}
              </span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1">
                <ScreenIcon />
                {params.aspectRatio}
              </span>
            </div>
            <ChevronUpIcon />
          </button>
        </div>
      </div>

      {/* 底部按钮 */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <button
          onClick={handleCreateVideo}
          disabled={!prompt.trim() || isCreating}
          className="w-full py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <LoadingIcon />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>Create Video</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
              </svg>
              <span>{credits}</span>
            </>
          )}
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
        model={selectedModel}
        params={params}
        onParamsChange={setParams}
        onCreateVideo={handleCreateVideo}
      />
    </div>
  );
}
