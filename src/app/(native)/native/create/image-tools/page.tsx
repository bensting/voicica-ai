'use client';

import { useState, useEffect, useRef } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import GeneratingModal, { type GeneratingStatus } from '@/components/native/common/GeneratingModal';
import ImageToolDetailModal from '@/components/native/me/ImageToolDetailModal';
import { createImageToolTask, getImageToolTaskStatus, type ImageToolType } from '@/actions/image-tools';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';
import { creditsCostConfig } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { adConfig } from '@/config/native/adConfig';
import { sendLocalNotification } from '@/lib/notifications';

const CREDITS_PER_TASK = creditsCostConfig[ProductType.IMAGE_TOOL] || 1;

type TabType = 'bg-remove' | 'upscale';

// 图标组件
const UploadIcon = () => (
  <svg className="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

/** DetailModal 需要的结果数据 */
interface ImageToolResult {
  taskId: string;
  toolType: 'bg-remove' | 'upscale';
  originalImageUrl: string;
  resultImageUrl: string;
  creditsUsed: number;
}

/**
 * Native Image Tools 页面
 * BG Remover & HD Upscaler
 */
export default function NativeImageToolsPage() {
  const { credits, refreshCredits } = useCredits();
  const { isSubscribed } = useSubscription();
  const { showRewardedAd } = useRewardedAd();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('bg-remove');

  // 上传状态
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null); // object URL for preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  // 记住创建时的原图 R2 URL（server action 返回 taskId 后通过 DB 查不到原图 URL，所以这里通过轮询结果获取）
  const currentToolTypeRef = useRef<TabType>('bg-remove');

  // DetailModal 结果
  const [detailResult, setDetailResult] = useState<ImageToolResult | null>(null);

  // UI 弹窗状态
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [insufficientCreditsInfo, setInsufficientCreditsInfo] = useState<{ required: number; current: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 切换 Tab 时清空状态
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    clearAll();
  };

  // 清空所有状态
  const clearAll = () => {
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview);
    }
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setError(null);
    setTaskId(null);
    setIsGenerating(false);
  };

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, or WebP)');
      return;
    }

    const maxSize = activeTab === 'bg-remove' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxMB = activeTab === 'bg-remove' ? 5 : 10;
    if (file.size > maxSize) {
      setError(`Image size exceeds ${maxMB}MB limit`);
      return;
    }

    // 读取为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      setUploadedImagePreview(URL.createObjectURL(file));
      setError(null);
    };
    reader.readAsDataURL(file);

    // 重置 input 以允许重新选择相同文件
    event.target.value = '';
  };

  // 删除已上传图片
  const handleClearImage = () => {
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview);
    }
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setError(null);
  };

  // 轮询任务状态
  useEffect(() => {
    if (!taskId || generatingStatus !== 'generating') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getImageToolTaskStatus(taskId);
        console.log('🔧 [ImageTools Polling] Status:', status);

        if (status.status === 'SUCCESS' && status.resultImageUrl) {
          setGeneratingStatus('loading');
          setIsGenerating(false);
          refreshCredits();
          sendLocalNotification('image', 'success');

          // 构造 DetailModal 需要的数据并弹出
          setDetailResult({
            taskId,
            toolType: currentToolTypeRef.current,
            originalImageUrl: status.originalImageUrl || uploadedImagePreview || '',
            resultImageUrl: status.resultImageUrl,
            creditsUsed: CREDITS_PER_TASK,
          });
          setIsGeneratingModalOpen(false); // 关闭生成中弹窗
          setTaskId(null);
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Processing failed');
          setIsGenerating(false);
          setTaskId(null);
          sendLocalNotification('image', 'failure');
        } else if (status.status === 'PROCESSING') {
          setGeneratingProgress(50);
        }
      } catch (err) {
        console.error('🔧 [ImageTools Polling] Error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, generatingStatus, refreshCredits, uploadedImagePreview]);

  // 处理按钮点击
  const handleProcess = async () => {
    if (!uploadedImage || isGenerating) return;

    // 检查积分
    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: credits,
      requiredCredits: CREDITS_PER_TASK,
      onInsufficientCredits: () => {
        setInsufficientCreditsInfo({ required: CREDITS_PER_TASK, current: credits });
        setIsInsufficientCreditsModalOpen(true);
      },
    });
    if (!hasEnoughCredits) return;

    // 记录当前工具类型
    currentToolTypeRef.current = activeTab;

    // 打开生成弹窗
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(10);
    setError(null);
    setIsGenerating(true);
    setAdWatched(false);

    try {
      const result = await createImageToolTask(activeTab as ImageToolType, uploadedImage);

      if (!result.success) {
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to process image');
        setIsGenerating(false);
        return;
      }

      // 开始轮询
      setTaskId(result.taskId!);
      setGeneratingProgress(20);
      refreshCredits();
    } catch (err) {
      console.error('🔧 [handleProcess] Error:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to process image');
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

  // 处理新的图片（从 DetailModal 调用）
  const handleProcessNew = () => {
    setDetailResult(null);
    handleClearImage();
  };

  // 非订阅用户：生成开始后自动弹出激励广告
  useEffect(() => {
    if (!isGeneratingModalOpen || generatingStatus !== 'generating' || isSubscribed || adWatched) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[ImageTools] Auto showing rewarded ad...');
        const result = await showRewardedAd();
        if (result.success) {
          setAdWatched(true);
        }
      } catch (err) {
        console.error('[ImageTools] Ad error:', err);
      }
    }, adConfig.rewardedAdDelayMs);

    return () => clearTimeout(timer);
  }, [isGeneratingModalOpen, generatingStatus, isSubscribed, adWatched, showRewardedAd]);

  const canProcess = !!uploadedImage && !isGenerating;
  const tabLabel = activeTab === 'bg-remove' ? 'BG Remove' : 'HD Upscale';
  const maxSizeMB = activeTab === 'bg-remove' ? 5 : 10;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title="BG Remover & HD Upscaler" />

      {/* Content Area */}
      <div
        className="flex-1 flex flex-col px-4 overflow-y-auto"
        style={{
          paddingBottom: 'calc(100px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Tab Switcher */}
        <div className="flex bg-gray-800/60 rounded-xl p-1 mb-4">
          <button
            onClick={() => handleTabChange('bg-remove')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bg-remove'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            BG Remove
          </button>
          <button
            onClick={() => handleTabChange('upscale')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'upscale'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            HD Upscale
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Upload Image</span>
            <span className="text-gray-500 text-xs">Max {maxSizeMB}MB</span>
          </div>

          {uploadedImagePreview ? (
            <div className="relative">
              <div className="aspect-video bg-gray-800/60 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImagePreview}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <button
                onClick={handleClearImage}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="aspect-video border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition-colors bg-gray-800/30">
                <UploadIcon />
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Tap to upload image</p>
                  <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP supported</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Tool Description */}
        <div className="bg-gray-800/30 rounded-xl p-4 mb-4">
          {activeTab === 'bg-remove' ? (
            <>
              <h3 className="text-white text-sm font-medium mb-2">Background Remover</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Automatically remove the background from your image using AI.
                Perfect for product photos, portraits, and more.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-white text-sm font-medium mb-2">HD Upscaler</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Upscale your image to higher resolution with AI enhancement.
                Makes low-resolution images crisp and clear.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <CreditsInfoBar
          credits={credits}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleProcess()}
          disabled={!canProcess}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Process</span>
              <CreditsIcon className="w-3.5 h-3.5" />
              <span>{CREDITS_PER_TASK}</span>
            </>
          )}
        </GradientButton>
      </div>

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

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGeneratingModalOpen}
        status={generatingStatus}
        type="image-tool"
        progress={generatingProgress}
        error={generatingError}
        credits={credits}
        onClose={handleCloseGeneratingModal}
        onCreateAnother={handleCloseGeneratingModal}
        onTryAgain={() => {
          handleCloseGeneratingModal();
          void handleProcess();
        }}
        showAdPrompt={!isSubscribed}
        adWatched={adWatched}
      />

      {/* Detail Modal - 生成成功后显示 */}
      {detailResult && (
        <ImageToolDetailModal
          result={detailResult}
          onClose={() => setDetailResult(null)}
          onProcessNew={handleProcessNew}
        />
      )}
    </div>
  );
}
