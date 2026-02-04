'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useLanguage } from '@/contexts/LanguageContext';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import LoginModal from '@/components/native/LoginModal';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import { createImageTask, getImageTaskStatus, getImageRecordByTaskId, deleteImageRecord, type ImageRecord } from '@/actions/image';
import { imageModels, type ImageModel, DEFAULT_IMAGE_MODEL_ID } from '@/config/native/imageModels';
import { adConfig } from '@/config/native/adConfig';
import { sendLocalNotification } from '@/lib/notifications';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';
import ImageDetailModal from '@/components/native/me/ImageDetailModal';
import GeneratingModal, { type GeneratingStatus } from '@/components/native/common/GeneratingModal';

const IMAGE_MODEL_STORAGE_KEY = 'image_selected_model';
const IMAGE_PROMPT_STORAGE_KEY = 'image_last_prompt';

// 图标组件
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// 魔法棒图标
const MagicWandIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5" />
    <path d="M3 21l9-9" strokeLinecap="round" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
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

// 比例图标
const AspectRatioIcon = ({ ratio }: { ratio: string }) => {
  const getIconStyle = () => {
    switch (ratio) {
      case '16:9':
        return 'w-6 h-3.5';
      case '9:16':
        return 'w-3.5 h-6';
      case '4:3':
        return 'w-5 h-4';
      case '3:4':
        return 'w-4 h-5';
      case '1:1':
        return 'w-4 h-4';
      case '2:3':
        return 'w-3.5 h-5';
      case '3:2':
        return 'w-5 h-3.5';
      case '21:9':
        return 'w-7 h-3';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <div className={`${getIconStyle()} border-2 border-current rounded-sm`} />
  );
};


/**
 * Native AI Image 页面
 */
export default function NativeImagePage() {
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();
  const { isSubscribed } = useSubscription();
  const { showRewardedAd } = useRewardedAd();
  const { t } = useLanguage();

  // 广告状态
  const [adWatched, setAdWatched] = useState(false);
  const generateInputRef = useRef<HTMLTextAreaElement>(null);

  // UI 状态
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [insufficientCreditsInfo, setInsufficientCreditsInfo] = useState<{ required: number; current: number } | null>(null);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [isGeneratePromptSheetOpen, setIsGeneratePromptSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate Prompt 状态
  const [generateInput, setGenerateInput] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatePromptError, setGeneratePromptError] = useState<string | null>(null);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<ImageRecord | null>(null);

  // 输入状态 - 默认选中 Seedream 4.5 或从 localStorage 恢复
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(IMAGE_PROMPT_STORAGE_KEY) || '';
  });
  const [selectedModel, setSelectedModel] = useState<ImageModel>(() => {
    // 服务端渲染时使用默认模型
    if (typeof window === 'undefined') {
      return imageModels.find(m => m.id === DEFAULT_IMAGE_MODEL_ID) || imageModels[0];
    }
    // 客户端尝试从 localStorage 恢复
    const savedModelId = localStorage.getItem(IMAGE_MODEL_STORAGE_KEY);
    if (savedModelId) {
      const savedModel = imageModels.find(m => m.id === savedModelId);
      if (savedModel) return savedModel;
    }
    // 默认使用 Z-Image
    return imageModels.find(m => m.id === DEFAULT_IMAGE_MODEL_ID) || imageModels[0];
  });
  const [guidanceImage, setGuidanceImage] = useState<File | null>(null);
  const [guidanceImageUrl, setGuidanceImageUrl] = useState<string | null>(null);

  // 参数状态
  const [isPublic, setIsPublic] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('standard'); // Z-Image default

  // Focus input when generate prompt sheet opens
  useEffect(() => {
    if (isGeneratePromptSheetOpen && generateInputRef.current) {
      setTimeout(() => generateInputRef.current?.focus(), 100);
    }
  }, [isGeneratePromptSheetOpen]);

  // 用于追踪是否是初次加载
  const isInitialMount = useRef(true);

  // 当模型改变时，重置参数并清空 prompt
  useEffect(() => {
    if (selectedModel.qualities.length > 0) {
      setQuality(selectedModel.qualities[0].id);
    }
    if (selectedModel.aspectRatios.length > 0) {
      setAspectRatio(selectedModel.aspectRatios[0]);
    }
    // 保存选择到 localStorage
    localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, selectedModel.id);

    // 切换模型时清空 prompt（初次加载除外）
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setPrompt('');
    }
  }, [selectedModel]);

  // 保存 prompt 到 localStorage（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(IMAGE_PROMPT_STORAGE_KEY, prompt);
    }, 500);
    return () => clearTimeout(timer);
  }, [prompt]);

  // 轮询任务状态
  useEffect(() => {
    if (!taskId || generatingStatus !== 'generating') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getImageTaskStatus(taskId);
        console.log('🖼️ [Image Polling] Status:', status);

        if (status.progress) {
          setGeneratingProgress(status.progress);
        }

        if (status.status === 'SUCCESS') {
          setGeneratingStatus('loading'); // 先显示加载状态
          setIsGenerating(false);
          refreshCredits();
          sendLocalNotification('image', 'success');
          // 获取生成的图片记录并显示详情
          const imageRecord = await getImageRecordByTaskId(taskId);
          if (imageRecord) {
            setGeneratedImage(imageRecord);
            setIsGeneratingModalOpen(false); // 关闭生成中弹窗
          } else {
            // 如果获取失败，显示成功状态
            setGeneratingStatus('success');
          }
          setTaskId(null);
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Image generation failed');
          setIsGenerating(false);
          setTaskId(null);
          sendLocalNotification('image', 'failure');
        }
      } catch (err) {
        console.error('🖼️ [Image Polling] Error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, generatingStatus, refreshCredits]);

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('native.createImage.errorSelectImage'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('native.createImage.errorImageSize'));
      return;
    }

    setGuidanceImage(file);
    const url = URL.createObjectURL(file);
    setGuidanceImageUrl(url);
    setError(null);
  };

  // 清除引导图片
  const handleClearImage = () => {
    if (guidanceImageUrl) {
      URL.revokeObjectURL(guidanceImageUrl);
    }
    setGuidanceImage(null);
    setGuidanceImageUrl(null);
  };

  // 清除提示词
  const handleClearPrompt = () => {
    setPrompt('');
  };

  // 生成提示词
  const handleGeneratePrompt = async () => {
    if (!generateInput.trim() || isGeneratingPrompt) return;

    setIsGeneratingPrompt(true);
    setGeneratePromptError(null);

    try {
      const response = await fetch('/api/ai/generate-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generateInput.trim(),
          maxLength: selectedModel.maxPromptLength,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      // Set the generated prompt (truncate if exceeds max length)
      const generatedPrompt = data.prompt || '';
      setPrompt(generatedPrompt.substring(0, selectedModel.maxPromptLength));
      // Clear the generate input
      setGenerateInput('');
      // Close the sheet
      setIsGeneratePromptSheetOpen(false);
    } catch (err) {
      setGeneratePromptError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // 计算预估积分
  const estimatedCredits = prompt.trim() ? selectedModel.credits : 0;

  // 是否可以生成
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 检查积分是否足够
    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: credits,
      requiredCredits: selectedModel.credits,
      onInsufficientCredits: () => {
        setInsufficientCreditsInfo({ required: selectedModel.credits, current: credits });
        setIsInsufficientCreditsModalOpen(true);
      },
    });
    if (!hasEnoughCredits) return;

    // 打开生成中弹窗
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(10);
    setError(null);
    setIsGenerating(true);
    // 重置广告状态
    setAdWatched(false);

    try {
      // 如果有引导图片，先上传
      let uploadedImageUrl: string | undefined;
      if (guidanceImage && selectedModel.supportsImageInput) {
        const formData = new FormData();
        formData.append('file', guidanceImage);
        formData.append('type', 'image-guidance');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedImageUrl = uploadResult.url;
        }
      }

      // 创建任务
      const result = await createImageTask({
        modelId: selectedModel.id,
        prompt,
        aspectRatio,
        quality,
        isPublic,
        guidanceImageUrl: uploadedImageUrl,
      });

      if (!result.success) {
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to create image task');
        setIsGenerating(false);
        return;
      }

      // 开始轮询
      setTaskId(result.taskId!);
      setGeneratingProgress(20);

      // 清空输入
      setPrompt('');
      handleClearImage();
    } catch (err) {
      console.error('🖼️ [handleGenerate] Error:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to generate image');
      setIsGenerating(false);
    }
  };

  // 关闭生成弹窗
  const handleCloseGeneratingModal = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(0);
  };

  // 非订阅用户：生成开始后自动弹出激励广告
  useEffect(() => {
    if (!isGeneratingModalOpen || generatingStatus !== 'generating' || isSubscribed || adWatched) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[Image] Auto showing rewarded ad...');
        const result = await showRewardedAd();
        if (result.success) {
          setAdWatched(true);
        }
      } catch (err) {
        console.error('[Image] Ad error:', err);
      }
    }, adConfig.rewardedAdDelayMs);

    return () => clearTimeout(timer);
  }, [isGeneratingModalOpen, generatingStatus, isSubscribed, adWatched, showRewardedAd]);

  // 获取当前 quality 的显示标签
  const getQualityLabel = () => {
    const q = selectedModel.qualities.find((item) => item.id === quality);
    return q?.label || quality;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title={t('native.createImage.title')} />

      {/* Content Area */}
      <div
        className="flex-1 flex flex-col px-4 overflow-y-auto"
        style={{
          paddingBottom: 'calc(100px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Prompt Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{t('native.createImage.prompt')}</span>
            {/* Model Selector Trigger */}
            <button
              onClick={() => setIsModelSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              {/* Model Icon */}
              {selectedModel.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedModel.icon}
                  alt={selectedModel.name}
                  className="w-5 h-5 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={selectedModel.icon ? 'hidden' : ''}>🖼️</span>
              <span className="text-white">{selectedModel.name}</span>
              <ChevronDownIcon />
            </button>
          </div>

          {/* Prompt Input */}
          <div className="bg-gray-800/60 rounded-2xl p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, selectedModel.maxPromptLength))}
              placeholder={t('native.createImage.promptPlaceholder')}
              className="w-full h-32 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none leading-relaxed"
            />

            {/* Bottom Bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
              {/* Generate Prompt Button */}
              <button
                onClick={() => setIsGeneratePromptSheetOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-700/60 rounded-full text-xs text-gray-300 hover:bg-gray-600/60 transition-colors"
              >
                <MagicWandIcon />
                <span>{t('native.createImage.generatePrompt')}</span>
              </button>

              {/* Character Count & Clear */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {prompt.length}/{selectedModel.maxPromptLength}
                </span>
                <div className="w-px h-3.5 bg-gray-700" />
                <button
                  onClick={handleClearPrompt}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Guidance Section */}
        {selectedModel.supportsImageInput && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-medium">{t('native.createImage.imageGuidance')}</span>
              <span className="text-gray-500 text-sm">{t('native.createImage.optional')}</span>
              <InfoIcon />
            </div>

            {guidanceImageUrl ? (
              <div className="relative w-32 h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={guidanceImageUrl}
                  alt="Guidance"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors text-gray-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <PlusIcon />
              </label>
            )}
          </div>
        )}

        {/* Parameters Trigger */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{t('native.createImage.parameters')}</span>
          </div>
          <button
            onClick={() => setIsParameterSheetOpen(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
          >
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{isPublic ? t('native.createImage.public') : t('native.createImage.private')}</span>
              <span>·</span>
              <span>{aspectRatio}</span>
              {selectedModel.qualities.length > 0 && (
                <>
                  <span>·</span>
                  <span>{getQualityLabel()}</span>
                </>
              )}
            </div>
            <ChevronDownIcon />
          </button>
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: t('native.createImage.imageGeneration'), credits: selectedModel.credits }]}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('native.createImage.creating')}</span>
            </>
          ) : (
            <>
              <span>{t('native.createImage.createImage')}</span>
              {estimatedCredits > 0 && (
                <>
                  <CreditsIcon className="w-3.5 h-3.5" />
                  <span>{estimatedCredits}</span>
                </>
              )}
            </>
          )}
        </GradientButton>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={isInsufficientCreditsModalOpen}
        onClose={() => setIsInsufficientCreditsModalOpen(false)}
        onGetFreeCredits={() => {
          setIsInsufficientCreditsModalOpen(false);
          setIsDailyTasksModalOpen(true);
        }}
        requiredCredits={insufficientCreditsInfo?.required}
        currentCredits={insufficientCreditsInfo?.current}
      />

      {/* Daily Tasks Modal */}
      <NativeDailyTasksModal
        isOpen={isDailyTasksModalOpen}
        onClose={() => setIsDailyTasksModalOpen(false)}
      />

      {/* Generate Prompt Sheet */}
      {isGeneratePromptSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isGeneratingPrompt && setIsGeneratePromptSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-lg bg-[#1a1a2e] rounded-t-3xl animate-slide-up"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 16px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h3 className="text-lg font-semibold text-white">{t('native.createImage.generatePromptTitle')}</h3>
              <button
                onClick={() => !isGeneratingPrompt && setIsGeneratePromptSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                disabled={isGeneratingPrompt}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-400 mb-3">
                {t('native.createImage.generatePromptDesc')}
              </p>

              {/* Input */}
              <textarea
                ref={generateInputRef}
                value={generateInput}
                onChange={(e) => setGenerateInput(e.target.value.slice(0, 500))}
                placeholder={t('native.createImage.generatePromptPlaceholder')}
                className="w-full h-24 p-3 bg-gray-800/60 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                disabled={isGeneratingPrompt}
              />

              {/* Character count */}
              <div className="flex justify-end mt-1 mb-3">
                <span className="text-xs text-gray-500">{generateInput.length}/500</span>
              </div>

              {/* Error */}
              {generatePromptError && (
                <div className="mb-3 p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
                  {generatePromptError}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGeneratePrompt}
                disabled={!generateInput.trim() || isGeneratingPrompt}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingPrompt ? (
                  <>
                    <LoadingSpinner />
                    <span>{t('native.createImage.generating')}</span>
                  </>
                ) : (
                  <>
                    <MagicWandIcon className="w-4 h-4" />
                    <span>{t('native.createImage.generate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selector Sheet */}
      {isModelSheetOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModelSheetOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl animate-slide-up"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            <h3 className="text-white font-semibold text-lg text-center mb-4">{t('native.createImage.selectModel')}</h3>
            <div className="px-4 pb-6 space-y-3">
              {imageModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setIsModelSheetOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                    selectedModel.id === model.id
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-gray-800/60 border border-transparent hover:bg-gray-700/60'
                  }`}
                >
                  {model.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={model.icon}
                      alt={model.name}
                      className="w-12 h-12 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl ${model.icon ? 'hidden' : ''}`}>
                    🖼️
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{model.name}</p>
                      <span className="flex items-center gap-1 text-xs text-purple-400">
                        <CreditsIcon className="w-3 h-3" />
                        {model.credits} {t('native.createImage.credits')}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{model.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parameter Settings Sheet */}
      {isParameterSheetOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsParameterSheetOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#1a1a2e]">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            <h3 className="text-white font-semibold text-lg text-center mb-6 sticky top-6 bg-[#1a1a2e]">
              {t('native.createImage.parameterSettings')}
            </h3>

            <div className="px-4 pb-6 space-y-6">
              {/* Visibility */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-medium">{t('native.createImage.visibility')}</span>
                  <InfoIcon />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isPublic
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    }`}
                  >
                    {t('native.createImage.public')}
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      !isPublic
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    }`}
                  >
                    {t('native.createImage.private')}
                  </button>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="text-white font-medium mb-3 block">{t('native.createImage.aspectRatio')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedModel.aspectRatios.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                        aspectRatio === ratio
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                      }`}
                    >
                      <AspectRatioIcon ratio={ratio} />
                      <span>{ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality - 仅在模型有 quality 选项时显示 */}
              {selectedModel.qualities.length > 0 && (
                <div>
                  <span className="text-white font-medium mb-3 block">{t('native.createImage.quality')}</span>
                  <div className="flex gap-2">
                    {selectedModel.qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setQuality(q.id)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors relative ${
                          quality === q.id
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                        }`}
                      >
                        {q.label}
                        {q.isPro && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-[10px] font-bold rounded">
                            Pro
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <GradientButton
                onClick={() => {
                  setIsParameterSheetOpen(false);
                  void handleGenerate();
                }}
                disabled={!canGenerate}
              >
                {t('native.createImage.createImage')}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal - 生成成功后显示 */}
      {generatedImage && (
        <ImageDetailModal
          image={generatedImage}
          onClose={() => setGeneratedImage(null)}
          onRecreate={(image) => {
            // 使用生成的图片参数重新创建
            setPrompt(image.prompt);
            setAspectRatio(image.aspect_ratio);
            if (image.quality) setQuality(image.quality);
            const model = imageModels.find(m => m.id === image.model);
            if (model) setSelectedModel(model);
            setGeneratedImage(null);
          }}
          onDelete={async (image) => {
            // 删除图片记录
            await deleteImageRecord(image.id);
            setGeneratedImage(null);
          }}
        />
      )}

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGeneratingModalOpen}
        status={generatingStatus}
        type="image"
        progress={generatingProgress}
        error={generatingError}
        credits={credits}
        onClose={handleCloseGeneratingModal}
        onCreateAnother={handleCloseGeneratingModal}
        onTryAgain={() => {
          handleCloseGeneratingModal();
          void handleGenerate();
        }}
        showAdPrompt={!isSubscribed}
        adWatched={adWatched}
      />
    </div>
  );
}
