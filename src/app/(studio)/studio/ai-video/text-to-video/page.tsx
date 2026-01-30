'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Coins, Sparkles, ChevronDown, Upload, X, Info, Camera, Volume2 } from 'lucide-react';
import {
  videoModels,
  defaultVideoModel,
  calculateCredits,
  type VideoModel,
} from '@/config/native/videoModels';
import { createVideoTask, getVideoTaskStatus, type VideoTaskStatus } from '@/actions/video';

// localStorage key
const STORAGE_KEY = 'video_draft_v2';
const MIN_PROMPT_LENGTH = 10;
const POLL_INTERVAL = 5000;

/**
 * AI Video Page
 *
 * Uses videoModels config for model-specific options
 */
export default function TextToVideoPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { user } = useFirebaseAuth();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();

  // Set page title
  useEffect(() => {
    setTitle(t('studio.menu.aiVideo'));
  }, [t, setTitle]);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(defaultVideoModel?.id || 'seedance-1.5-pro');
  const [quality, setQuality] = useState(defaultVideoModel?.defaultQuality || '480p');
  const [duration, setDuration] = useState(defaultVideoModel?.defaultDuration || '4s');
  const [aspectRatio, setAspectRatio] = useState(defaultVideoModel?.defaultAspectRatio || '16:9');
  const [fixedLens, setFixedLens] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.model) setModel(parsed.model);
        if (parsed.quality) setQuality(parsed.quality);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
        if (typeof parsed.fixedLens === 'boolean') setFixedLens(parsed.fixedLens);
        if (typeof parsed.generateAudio === 'boolean') setGenerateAudio(parsed.generateAudio);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      prompt, model, quality, duration, aspectRatio, fixedLens, generateAudio,
    }));
  }, [prompt, model, quality, duration, aspectRatio, fixedLens, generateAudio]);

  // Get selected model
  const selectedModel = videoModels.find(m => m.id === model) || defaultVideoModel;

  // When model changes, reset to default values
  useEffect(() => {
    if (selectedModel) {
      setQuality(selectedModel.defaultQuality);
      setDuration(selectedModel.defaultDuration);
      setAspectRatio(selectedModel.defaultAspectRatio);
      setFixedLens(false);
      setGenerateAudio(false);
    }
  }, [model]);

  // Calculate credits cost
  const creditsCost = selectedModel
    ? calculateCredits(selectedModel, quality, duration, generateAudio)
    : 0;

  // Can generate check
  const canGenerate = prompt.trim().length >= MIN_PROMPT_LENGTH && !isGenerating && creditsCost > 0;

  // Handle model selection
  const handleModelSelect = (m: VideoModel) => {
    setModel(m.id);
    setIsModelSelectorOpen(false);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Poll task status
  const pollTaskStatus = useCallback(async (tid: string) => {
    try {
      const status: VideoTaskStatus = await getVideoTaskStatus(tid);
      if (!isMountedRef.current) return;

      setProgress(status.progress);

      if (status.status === 'SUCCESS' && status.result) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
        setVideoUrl(status.result.video_url);
        setTaskId(null);
        void refreshCredits();
      } else if (status.status === 'FAILURE') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
        setError(status.error || 'Video generation failed');
        setTaskId(null);
      }
    } catch (err) {
      console.error('[Video] Poll error:', err);
    }
  }, [refreshCredits]);

  // Start polling
  const startPolling = useCallback((tid: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    pollIntervalRef.current = setInterval(() => {
      void pollTaskStatus(tid);
    }, POLL_INTERVAL);
    void pollTaskStatus(tid);
  }, [pollTaskStatus]);

  // Handle generate
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);

    try {
      const durationNum = parseInt(duration.replace('s', ''), 10);

      const result = await createVideoTask({
        prompt: prompt.trim(),
        resolution: quality as '480p' | '720p' | '768p' | '1080p',
        duration: durationNum as 5 | 8 | 10,
        aspect_ratio: aspectRatio as '16:9' | '9:16',
        model: selectedModel?.apiModelId || model,
      });

      if (!isMountedRef.current) return;

      if (result.status === 'FAILURE') {
        setIsGenerating(false);
        setError(result.error || 'Failed to create video task');
        return;
      }

      setTaskId(result.task_id);
      void refreshCredits();
      startPolling(result.task_id);
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsGenerating(false);
      setError(errorMessage);
    }
  };

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
      <div className="lg:hidden fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-auto" style={{ top: 'calc(60px + var(--safe-area-inset-top, 0px))' }}>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            {videoUrl ? (
              <div className="space-y-3">
                <video
                  src={videoUrl}
                  controls
                  className="w-full aspect-video rounded-xl bg-black"
                />
                <button
                  onClick={handleDownload}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  {t('video.download') || 'Download'}
                </button>
              </div>
            ) : isGenerating ? (
              <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 rounded-xl">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">{t('video.generatingVideo')}</p>
                <p className="text-gray-400 text-sm mt-1">{progress}%</p>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-xl">
                <p className="text-gray-400">{t('video.previewPlaceholder')}</p>
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('video.model')}
            </label>
            <button
              onClick={() => setIsModelSelectorOpen(true)}
              disabled={isGenerating}
              className="w-full flex items-center justify-between p-3 bg-purple-50 border-2 border-purple-200 rounded-xl disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedModel?.name}</p>
                  <p className="text-xs text-gray-500">{selectedModel?.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {t('video.latest')}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          </div>

          {/* Image Guidance - Only show when model supports it */}
          {selectedModel?.imageGuidance?.enabled && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Image Guidance
                </label>
                <span className="text-xs text-gray-400">(optional)</span>
              </div>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Reference" className="w-full aspect-video object-cover rounded-xl" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload reference image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Model-specific Options */}
          {(selectedModel?.modelOptions?.fixedLens || selectedModel?.modelOptions?.generateAudio) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
              {selectedModel?.modelOptions?.fixedLens && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">fixed_lens</p>
                      <p className="text-xs text-gray-400">Keep camera fixed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFixedLens(!fixedLens)}
                    disabled={isGenerating}
                    className={`w-11 h-6 rounded-full transition-colors ${fixedLens ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${fixedLens ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
              {selectedModel?.modelOptions?.generateAudio && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">generate_audio</p>
                      <p className="text-xs text-gray-400">Generate audio (2x credits)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGenerateAudio(!generateAudio)}
                    disabled={isGenerating}
                    className={`w-11 h-6 rounded-full transition-colors ${generateAudio ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${generateAudio ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Video Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('video.resolution')}
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedModel?.qualityOptions.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      quality === q.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('video.duration')}
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedModel?.durationOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      duration === d.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('video.aspectRatio')}
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedModel?.aspectRatioOptions.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    disabled={isGenerating}
                    className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      aspectRatio === ar.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {ar.icon === 'landscape' && <span>🖥️</span>}
                    {ar.icon === 'portrait' && <span>📱</span>}
                    {ar.icon === 'square' && <span>⬜</span>}
                    {ar.icon === 'classic' && <span>🎬</span>}
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credits Cost */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">{t('video.creditsCost')}</span>
              <span className="text-purple-600 font-semibold">{creditsCost} {t('common.credits')}</span>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('video.promptLabel')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('video.promptPlaceholder')}
              disabled={isGenerating}
              rows={4}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-sm"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">{prompt.length} / 1000</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => void handleGenerate()}
            disabled={!canGenerate}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? t('video.generating') : t('video.generate')}</span>
            <span className="ml-1">{creditsCost} {t('common.credits')}</span>
          </button>
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
            {/* Left Column: Settings */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('video.model')}
                </label>
                <button
                  onClick={() => setIsModelSelectorOpen(true)}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 border-2 border-purple-200 rounded-xl disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{selectedModel?.name}</p>
                      <p className="text-xs text-gray-500">{selectedModel?.description}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Image Guidance */}
              {selectedModel?.imageGuidance?.enabled && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Image Guidance</label>
                    <span className="text-xs text-gray-400">(optional)</span>
                  </div>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Reference" className="w-full aspect-video object-cover rounded-xl" />
                      <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload reference image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}

              {/* Model Options */}
              {(selectedModel?.modelOptions?.fixedLens || selectedModel?.modelOptions?.generateAudio) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
                  {selectedModel?.modelOptions?.fixedLens && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">fixed_lens</p>
                          <p className="text-xs text-gray-400">Keep camera fixed</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFixedLens(!fixedLens)}
                        disabled={isGenerating}
                        className={`w-11 h-6 rounded-full transition-colors ${fixedLens ? 'bg-purple-600' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${fixedLens ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  )}
                  {selectedModel?.modelOptions?.generateAudio && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">generate_audio</p>
                          <p className="text-xs text-gray-400">Generate audio (2x credits)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGenerateAudio(!generateAudio)}
                        disabled={isGenerating}
                        className={`w-11 h-6 rounded-full transition-colors ${generateAudio ? 'bg-purple-600' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${generateAudio ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Video Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.resolution')}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel?.qualityOptions.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          quality === q.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.duration')}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel?.durationOptions.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          duration === d.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.aspectRatio')}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel?.aspectRatioOptions.map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => setAspectRatio(ar.value)}
                        disabled={isGenerating}
                        className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          aspectRatio === ar.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {ar.icon === 'landscape' && <span>🖥️</span>}
                        {ar.icon === 'portrait' && <span>📱</span>}
                        {ar.icon === 'square' && <span>⬜</span>}
                        {ar.icon === 'classic' && <span>🎬</span>}
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credits Cost */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">{t('video.creditsCost')}</span>
                  <span className="text-purple-600 font-semibold">{creditsCost} {t('common.credits')}</span>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.promptLabel')}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('video.promptPlaceholder')}
                  disabled={isGenerating}
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-sm min-h-[120px]"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">{prompt.length} / 1000</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
                className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? t('video.generating') : t('video.generate')}</span>
                <span className="ml-1">{creditsCost} {t('common.credits')}</span>
              </button>
            </div>

            {/* Right Column: Preview */}
            <div className="col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('video.preview')}</h2>
                {videoUrl ? (
                  <div className="space-y-4">
                    <video src={videoUrl} controls className="w-full aspect-video rounded-xl bg-black" />
                    <button
                      onClick={handleDownload}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                ) : isGenerating ? (
                  <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 rounded-xl">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">{t('video.generatingVideo')}</p>
                    <p className="text-gray-400 text-sm mt-1">{progress}%</p>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-xl">
                    <p className="text-gray-400">{t('video.previewPlaceholder')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      {isModelSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModelSelectorOpen(false)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Select Model</h3>
                <button onClick={() => setIsModelSelectorOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {videoModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m)}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    model === m.id ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-900">{m.name}</span>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {calculateCredits(m, m.defaultQuality, m.defaultDuration, false)}+ credits
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">{m.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2 ml-6">
                    {m.imageGuidance?.enabled && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Image Guidance</span>
                    )}
                    {m.modelOptions?.generateAudio && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Audio</span>
                    )}
                    {m.modelOptions?.fixedLens && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Fixed Lens</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
