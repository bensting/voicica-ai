'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import LoginModal from '@/components/native/LoginModal';
import { createImageTask, getImageTaskStatus } from '@/actions/image';
import { imageModels, type ImageModel } from '@/config/native/imageModels';
import { sendLocalNotification } from '@/lib/notifications';

// 图标组件
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const AssistantIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </svg>
  </div>
);

const InfoIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06l-4.63 1.22-3.15-5.14c-.45-.74-1.44-.96-2.19-.51-.27.16-.49.4-.62.68L6.5 9.8l-4.63-1.22c-.8-.22-1.63.26-1.84 1.06-.1.34-.04.72.14 1.03l4.85 8.13c.16.27.44.44.75.52.13.03.26.05.39.05h11.68c.13 0 .26-.02.39-.05.31-.08.59-.25.75-.52l4.85-8.13c.18-.31.24-.69.14-1.03z" />
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

// 比例选项
const aspectRatios = [
  { id: '16:9', label: '16:9' },
  { id: '3:4', label: '3:4' },
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
];

const MAX_PROMPT_LENGTH = 3000;

/**
 * Native AI Image 页面
 */
export default function NativeImagePage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();

  // UI 状态
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);

  // 输入状态 - 默认选中 Seedream 4.5
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ImageModel>(imageModels[0]);
  const [guidanceImage, setGuidanceImage] = useState<File | null>(null);
  const [guidanceImageUrl, setGuidanceImageUrl] = useState<string | null>(null);

  // 参数状态
  const [isPublic, setIsPublic] = useState(true);
  const [imageCount, setImageCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('standard'); // Z-Image default

  // 当模型改变时，重置 quality 到模型的第一个选项
  useEffect(() => {
    if (selectedModel.qualities.length > 0) {
      setQuality(selectedModel.qualities[0].id);
    }
  }, [selectedModel]);

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
          setGeneratingStatus('success');
          setIsGenerating(false);
          setTaskId(null);
          refreshCredits();
          sendLocalNotification('image', 'success');
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
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
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

  // 计算预估积分
  const estimatedCredits = prompt.trim() ? selectedModel.credits * imageCount : 0;

  // 是否可以生成
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 打开生成中弹窗
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(10);
    setError(null);
    setIsGenerating(true);

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
        imageCount,
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

  // 查看历史
  const handleViewHistory = () => {
    setIsGeneratingModalOpen(false);
    router.push('/native/me?tab=image');
  };

  // 获取当前 quality 的显示标签
  const getQualityLabel = () => {
    const q = selectedModel.qualities.find((item) => item.id === quality);
    return q?.label || quality;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title="AI Image" />

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
            <span className="text-white font-medium">Prompt</span>
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
                />
              ) : (
                <span className="text-lg">🖼️</span>
              )}
              <span className="text-white">{selectedModel.name}</span>
              <ChevronDownIcon />
            </button>
          </div>

          {/* Prompt Input */}
          <div className="bg-gray-800/60 rounded-2xl p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, selectedModel.maxPromptLength))}
              placeholder="Please enter the prompt for generation. For example: Under the sunlight, a breeze gently sways the flowers, with a cinematic feel."
              className="w-full h-32 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:bg-gray-600/50 transition-colors">
                <AssistantIcon />
                <span>Assistant</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">
                  {prompt.length}/{selectedModel.maxPromptLength}
                </span>
                {prompt.length > 0 && (
                  <button
                    onClick={handleClearPrompt}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Guidance Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-medium">Image Guidance</span>
            <span className="text-gray-500 text-sm">(optional)</span>
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

        {/* Parameters Trigger */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Parameters</span>
          </div>
          <button
            onClick={() => setIsParameterSheetOpen(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
          >
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{isPublic ? 'Public' : 'Private'}</span>
              <span>·</span>
              <span>{imageCount}</span>
              <span>·</span>
              <span>{aspectRatio}</span>
              <span>·</span>
              <span>{getQualityLabel()}</span>
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
          creditRules={[{ name: 'Image generation', credits: selectedModel.credits }]}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>Create Image</span>
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
            <h3 className="text-white font-semibold text-lg text-center mb-4">Select Model</h3>
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
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                      🖼️
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{model.name}</p>
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
              Parameter Settings
            </h3>

            <div className="px-4 pb-6 space-y-6">
              {/* Image Count */}
              <div>
                <span className="text-white font-medium mb-3 block">Image count</span>
                <div className="flex gap-2">
                  {[1, 2, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setImageCount(count)}
                      className={`w-20 py-3 rounded-xl text-sm font-medium transition-colors ${
                        imageCount === count
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-medium">Visibility</span>
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
                    Public
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      !isPublic
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="text-white font-medium mb-3 block">Aspect Ratio</span>
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                        aspectRatio === ratio.id
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                      }`}
                    >
                      <AspectRatioIcon ratio={ratio.id} />
                      <span>{ratio.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <span className="text-white font-medium mb-3 block">Quality</span>
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

              {/* Create Button */}
              <GradientButton
                onClick={() => {
                  setIsParameterSheetOpen(false);
                  void handleGenerate();
                }}
                disabled={!canGenerate}
              >
                Create Image
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Generating Modal */}
      {isGeneratingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col"
          style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={handleCloseGeneratingModal}
              className="p-2 -ml-2 text-white"
            >
              <BackIcon />
            </button>
            <div className="flex items-center gap-1 text-white">
              <CreditsIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{credits}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {generatingStatus === 'generating' && (
              <>
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <div className="text-gray-400 animate-pulse text-2xl">🖼️</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Creating AI Image...</h3>
                {generatingProgress > 0 && (
                  <p className="text-blue-400 text-sm mb-2">{generatingProgress}%</p>
                )}
                <p className="text-gray-400 text-sm mb-8">
                  Estimated time: <span className="text-blue-400">30-60 seconds</span>
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium">
                  <CrownIcon />
                  <span>Use fast channel</span>
                </button>
              </>
            )}

            {generatingStatus === 'success' && (
              <>
                <div className="w-20 h-20 mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Image Created!</h3>
                <p className="text-gray-400 text-sm mb-8">Your AI image has been generated.</p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              </>
            )}

            {generatingStatus === 'error' && (
              <>
                <div className="w-20 h-20 mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Generation Failed</h3>
                <p className="text-red-400 text-sm mb-8 text-center px-4">
                  {generatingError || 'Something went wrong. Please try again.'}
                </p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseGeneratingModal();
                      void handleGenerate();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
