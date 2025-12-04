'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useVideoGenerator } from '@/hooks/useVideoGenerator';
import PromptInput from '@/components/features/studio/ai-video/PromptInput';
import VideoSettings from '@/components/features/studio/ai-video/VideoSettings';
import VideoPreview from '@/components/features/studio/ai-video/VideoPreview';
import ModelSelector from '@/components/features/studio/ai-video/ModelSelector';
import GenerateButton from '@/components/features/studio/ai-video/GenerateButton';
import { Coins } from 'lucide-react';

/**
 * Text-to-Video Page
 *
 * AI video generation using Google Veo 3.1
 */
export default function TextToVideoPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();

  // Set page title
  useEffect(() => {
    setTitle(t('video.textToVideo'));
  }, [t, setTitle]);

  // Video generator hook
  const {
    prompt,
    resolution,
    duration,
    aspectRatio,
    model,
    isGenerating,
    progress,
    error,
    videoUrl,
    creditsCost,
    canGenerate,
    setPrompt,
    setResolution,
    setDuration,
    setAspectRatio,
    setModel,
    handleGenerate,
  } = useVideoGenerator({
    onTaskSubmitted: () => {
      console.log('[T2V] Task submitted, refreshing credits');
      setTimeout(() => {
        void refreshCredits();
      }, 500);
    },
    onTaskCompleted: (url) => {
      console.log('[T2V] Video generated:', url);
      void refreshCredits();
    },
    onTaskFailed: (err) => {
      console.error('[T2V] Generation failed:', err);
    },
  });

  // Download video
  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 top-[60px] flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-auto">
        <div className="flex-1 flex flex-col px-4 py-4 gap-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Credits Display */}
          <div className="flex items-center justify-end gap-2 text-sm">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600">
              {creditsLoading ? '...' : credits} {t('common.credits')}
            </span>
          </div>

          {/* Video Preview */}
          <VideoPreview
            videoUrl={videoUrl}
            isGenerating={isGenerating}
            progress={progress}
            onDownload={handleDownload}
          />

          {/* Prompt Input */}
          <div className="flex-1 min-h-[120px]">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={isGenerating}
            />
          </div>

          {/* Model Selector */}
          <ModelSelector
            selectedModel={model}
            onModelChange={setModel}
            disabled={isGenerating}
          />

          {/* Video Settings */}
          <VideoSettings
            resolution={resolution}
            duration={duration}
            aspectRatio={aspectRatio}
            onResolutionChange={setResolution}
            onDurationChange={setDuration}
            onAspectRatioChange={setAspectRatio}
            disabled={isGenerating}
          />

          {/* Generate Button */}
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            isGenerating={isGenerating}
            creditsCost={creditsCost}
          />
        </div>

        {/* Bottom safe area */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 min-h-[calc(100vh-60px)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* Left Column: Settings (40%) */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Credits Display */}
              <div className="flex items-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700 font-medium">
                  {creditsLoading ? '...' : credits} {t('common.credits')}
                </span>
              </div>

              {/* Model Selector */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <ModelSelector
                  selectedModel={model}
                  onModelChange={setModel}
                  disabled={isGenerating}
                />
              </div>

              {/* Video Settings */}
              <VideoSettings
                resolution={resolution}
                duration={duration}
                aspectRatio={aspectRatio}
                onResolutionChange={setResolution}
                onDurationChange={setDuration}
                onAspectRatioChange={setAspectRatio}
                disabled={isGenerating}
              />

              {/* Prompt Input */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('video.promptLabel')}
                </label>
                <div className="flex-1">
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <GenerateButton
                onClick={handleGenerate}
                disabled={!canGenerate}
                isGenerating={isGenerating}
                creditsCost={creditsCost}
              />
            </div>

            {/* Right Column: Preview (60%) */}
            <div className="col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('video.preview')}
                </h2>
                <VideoPreview
                  videoUrl={videoUrl}
                  isGenerating={isGenerating}
                  progress={progress}
                  onDownload={handleDownload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}