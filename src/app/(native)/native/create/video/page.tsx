'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import PromptSection from '@/components/native/create/PromptSection';
import ImageGuidance from '@/components/native/create/ImageGuidance';
import AdvancedOptions from '@/components/native/create/AdvancedOptions';
import ParameterSettingsSheet from '@/components/native/create/ParameterSettingsSheet';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import GeneratingModal, { GeneratingStatus } from '@/components/native/common/GeneratingModal';
import VideoDetailModal from '@/components/native/me/VideoDetailModal';
import LoginModal from '@/components/native/LoginModal';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { VideoModel, defaultVideoModel, getModelDefaults, calculateCredits } from '@/config/native/videoModels';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getVideoRecordByTaskId, type VideoRecord } from '@/actions/video';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';

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
const VIDEO_PROMPT_STORAGE_KEY = 'video_draft_prompt';

export default function CreateVideoPage() {
  const router = useRouter();
  const { user, token } = useFirebaseAuth();
  const { credits: userCredits } = useCredits();
  const { isSubscribed } = useSubscription();
  const { showRewardedAd } = useRewardedAd();

  // 广告状态
  const [adWatched, setAdWatched] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isParamsSheetOpen, setIsParamsSheetOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPromptState] = useState('');
  const [selectedModel, setSelectedModel] = useState<VideoModel>(defaultVideoModel);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]); // 多图模式
  const [fixedLens, setFixedLens] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generating modal state
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('generating');
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [, setCurrentTaskId] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<VideoRecord | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [params, setParams] = useState<VideoParams>(() => {
    const defaults = getModelDefaults(defaultVideoModel);
    return {
      ...defaults,
      visibility: 'public',
    };
  });

  // 从 localStorage 恢复 prompt
  useEffect(() => {
    const savedPrompt = localStorage.getItem(VIDEO_PROMPT_STORAGE_KEY);
    if (savedPrompt) {
      setPromptState(savedPrompt);
    }
  }, []);

  // 包装 setPrompt，同时保存到 localStorage
  const setPrompt = (value: string) => {
    setPromptState(value);
    if (value) {
      localStorage.setItem(VIDEO_PROMPT_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(VIDEO_PROMPT_STORAGE_KEY);
    }
  };

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
    setImages([]);
    // 重置高级选项
    setFixedLens(false);
    setGenerateAudio(false);
  }, [selectedModel]);

  const handleModelChange = (model: VideoModel) => {
    setSelectedModel(model);
  };

  // Polling for task status via API
  const startPolling = useCallback((taskId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        // Use API endpoint instead of server action
        const response = await fetch(`/api/v1/native/video/task/${taskId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          console.error('Polling API error:', response.status);
          return;
        }

        const data = await response.json();
        const task = data.task;

        if (task.status === 'SUCCESS') {
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Clear draft
          localStorage.removeItem(VIDEO_PROMPT_STORAGE_KEY);

          // Show loading state while fetching result
          setGeneratingStatus('loading');

          // Fetch the generated video record
          const videoRecord = await getVideoRecordByTaskId(taskId);
          if (videoRecord) {
            setGeneratedVideo(videoRecord);
            setIsGeneratingModalOpen(false);
          } else {
            setGeneratingStatus('success');
          }
        } else if (task.status === 'FAILURE') {
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setGeneratingStatus('error');
          setGeneratingError(task.error_message || 'Video generation failed');
        } else {
          // Still processing
          setGeneratingProgress(task.progress || 0);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }, [token]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleCreateVideo = async () => {
    if (!prompt.trim() || isCreating) return;

    // Check login first
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // Check credits before creating
    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: userCredits,
      requiredCredits: requiredCredits,
      onInsufficientCredits: () => router.push('/native/subscribe'),
    });
    if (!hasEnoughCredits) return;

    setIsCreating(true);
    setError(null);

    try {
      // 构建请求体
      const requestBody: Record<string, unknown> = {
        prompt: prompt.trim(),
        modelId: selectedModel.id,
        quality: params.quality,
        duration: params.duration,
        aspectRatio: params.aspectRatio,
        visibility: params.visibility,
      };

      // 根据图片引导模式传递不同参数
      if (selectedModel.imageGuidance?.mode === 'multi') {
        if (images.length > 0) {
          requestBody.images = images;
        }
      } else {
        if (startFrame) requestBody.startFrame = startFrame;
        if (endFrame) requestBody.endFrame = endFrame;
      }

      // 如果模型支持高级选项，传递它们
      if (selectedModel.modelOptions) {
        if (selectedModel.modelOptions.fixedLens !== undefined) {
          requestBody.fixedLens = fixedLens;
        }
        if (selectedModel.modelOptions.generateAudio !== undefined) {
          requestBody.generateAudio = generateAudio;
        }
      }

      const response = await fetch('/api/v1/native/video/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoginModalOpen(true);
          return;
        }
        if (response.status === 402) {
          // Already handled by checkCreditsBeforeGenerate, but as fallback
          router.push('/native/subscribe');
          return;
        }
        throw new Error(data.error || 'Failed to create video');
      }

      // Success - show generating modal and start polling
      console.log('Video task created:', data.taskId);
      setCurrentTaskId(data.taskId);
      setGeneratingStatus('generating');
      setGeneratingProgress(0);
      setGeneratingError(null);
      // 重置广告状态
      setAdWatched(false);
      setIsGeneratingModalOpen(true);
      startPolling(data.taskId);
    } catch (err) {
      console.error('Create video error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create video');
    } finally {
      setIsCreating(false);
    }
  };

  const requiredCredits = calculateCredits(selectedModel, params.quality, params.duration, generateAudio);

  // Modal handlers
  const handleCloseGeneratingModal = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGeneratingModalOpen(false);
    setCurrentTaskId(null);
    setGeneratingProgress(0);
    setGeneratingError(null);
  };

  const handleCreateAnother = () => {
    setIsGeneratingModalOpen(false);
    setGeneratedVideo(null);
    setPrompt('');
  };

  const handleTryAgain = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingError(null);
  };

  // 非订阅用户：生成开始 5 秒后自动弹出激励广告
  useEffect(() => {
    if (!isGeneratingModalOpen || generatingStatus !== 'generating' || isSubscribed || adWatched) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[Video] Auto showing rewarded ad...');
        const result = await showRewardedAd();
        if (result.success) {
          setAdWatched(true);
        }
      } catch (err) {
        console.error('[Video] Ad error:', err);
      }
    }, 5000); // 5秒后自动弹出

    return () => clearTimeout(timer);
  }, [isGeneratingModalOpen, generatingStatus, isSubscribed, adWatched, showRewardedAd]);

  const handleCloseVideoDetail = () => {
    setGeneratedVideo(null);
    setPrompt('');
  };

  const handleRecreate = () => {
    setGeneratedVideo(null);
    // Keep the prompt for recreation
  };

  const handleDeleteVideo = () => {
    setGeneratedVideo(null);
    setPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* 头部 */}
      <CreatePageHeader title="AI Video" />

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 px-4 overflow-auto">
        {/* 模式切换 Tabs */}
        <div className="mb-4">
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

        {/* Prompt 区域 */}
        <PromptSection
          prompt={prompt}
          onPromptChange={setPrompt}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          maxLength={2500}
        />

        {/* Image Guidance */}
        <ImageGuidance
          config={selectedModel.imageGuidance}
          startFrame={startFrame}
          endFrame={endFrame}
          onStartFrameChange={setStartFrame}
          onEndFrameChange={setEndFrame}
          images={images}
          onImagesChange={setImages}
        />

        {/* Advanced Options (模型特有) */}
        <AdvancedOptions
          config={selectedModel.modelOptions}
          fixedLens={fixedLens}
          generateAudio={generateAudio}
          onFixedLensChange={setFixedLens}
          onGenerateAudioChange={setGenerateAudio}
        />

        {/* Parameters */}
        <div className="mt-6">
          <h3 className="text-white font-semibold mb-3">Parameters</h3>

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
              <span className="text-gray-600">|</span>
              <span>{params.visibility === 'public' ? 'Public' : 'Private'}</span>
            </div>
            <ChevronUpIcon />
          </button>
        </div>

        {/* 底部留白，防止被固定按钮遮挡 */}
        <div className="h-32" />
      </div>

      {/* 固定底部按钮 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Credits Info Bar */}
        <CreditsInfoBar
          credits={userCredits}
          creditRules={[{ name: 'Video generation', credits: requiredCredits }]}
          className="mb-3"
        />

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <GradientButton
          onClick={handleCreateVideo}
          disabled={!prompt.trim() || isCreating}
        >
          {isCreating ? (
            <>
              <LoadingIcon />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>Create</span>
              {prompt.trim() && requiredCredits > 0 && (
                <>
                  <CreditsIcon className="w-3.5 h-3.5" />
                  <span>{requiredCredits}</span>
                </>
              )}
            </>
          )}
        </GradientButton>
      </div>

      {/* Parameter Settings Sheet */}
      <ParameterSettingsSheet
        isOpen={isParamsSheetOpen}
        onClose={() => setIsParamsSheetOpen(false)}
        model={selectedModel}
        params={params}
        onParamsChange={setParams}
      />

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGeneratingModalOpen}
        status={generatingStatus}
        type="video"
        progress={generatingProgress}
        error={generatingError}
        credits={userCredits}
        onClose={handleCloseGeneratingModal}
        onCreateAnother={handleCreateAnother}
        onTryAgain={handleTryAgain}
        showAdPrompt={!isSubscribed}
        adWatched={adWatched}
      />

      {/* Video Detail Modal */}
      {generatedVideo && (
        <VideoDetailModal
          video={generatedVideo}
          onClose={handleCloseVideoDetail}
          onRecreate={handleRecreate}
          onDelete={handleDeleteVideo}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
