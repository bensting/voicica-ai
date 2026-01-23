'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import LoginModal from '@/components/features/auth/LoginModal';
import { GradientButton } from '@/components/ui';
import {
  musicModelsConfig,
  defaultMusicModelId,
  getMusicModelById,
  type MusicModel,
} from '@/config/native/musicModels';
import { createMusicTask, getMusicTaskStatus } from '@/actions/music';
import {
  Music,
  Sparkles,
  ChevronDown,
  Trash2,
  Upload,
  Crown,
  Check,
  X,
  Film,
  Loader2,
} from 'lucide-react';

// localStorage keys
const STORAGE_KEY = 'studio_music_draft';

// Tab 类型
type MusicTab = 'custom' | 'simple';

/**
 * Studio AI Music Page
 *
 * AI音乐生成页面，支持两种模式：
 * - Lyrics to Music: 通过歌词生成音乐
 * - Prompt to Music: 通过提示词生成音乐
 */
export default function StudioAiMusicPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();
  const { setTitle } = useStudio();
  const { credits, refreshCredits } = useCredits();
  const { isSubscribed } = useSubscription();

  // UI States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Assistant States
  const [isLyricsAssistantOpen, setIsLyricsAssistantOpen] = useState(false);
  const [lyricsPrompt, setLyricsPrompt] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isStyleAssistantOpen, setIsStyleAssistantOpen] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [isPromptAssistantOpen, setIsPromptAssistantOpen] = useState(false);
  const [promptAssistantInput, setPromptAssistantInput] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Generation status
  const [generatingStatus, setGeneratingStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskCreatedAt, setTaskCreatedAt] = useState<Date | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);

  // Form States
  const [activeTab, setActiveTab] = useState<MusicTab>('custom');
  const [model, setModel] = useState(defaultMusicModelId);
  const [isPublic, setIsPublic] = useState(true);
  const [isInstrumental, setIsInstrumental] = useState(false);

  // Simple mode
  const [prompt, setPrompt] = useState('');
  const maxPromptCharacters = 3000;

  // Custom mode
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle_] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  const maxLyricsCharacters = 5000;

  // Set page title
  useEffect(() => {
    setTitle(t('studio.menu.aiMusic'));
  }, [t, setTitle]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.model) setModel(parsed.model);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (typeof parsed.isInstrumental === 'boolean') setIsInstrumental(parsed.isInstrumental);
        if (typeof parsed.isPublic === 'boolean') setIsPublic(parsed.isPublic);
        if (parsed.lyrics) setLyrics(parsed.lyrics);
        if (parsed.style) setStyle(parsed.style);
        if (parsed.title) setTitle_(parsed.title);
        if (parsed.vocalGender) setVocalGender(parsed.vocalGender);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      prompt, model, activeTab, isInstrumental, isPublic,
      lyrics, style, title, vocalGender,
    }));
  }, [prompt, model, activeTab, isInstrumental, isPublic, lyrics, style, title, vocalGender]);

  // Get selected model
  const selectedModel = getMusicModelById(model);

  // Check if can generate
  const hasInput = activeTab === 'custom' ? lyrics.trim().length > 0 : prompt.trim().length > 0;
  const estimatedCredits = hasInput ? (selectedModel?.credits ?? 30) : 0;
  const canGenerate = hasInput && !isGenerating;

  // Handle model selection
  const handleModelSelect = (m: MusicModel) => {
    if (m.isPremium && !isSubscribed) {
      setIsModelSelectorOpen(false);
      router.push('/studio/settings/my-subscription');
      return;
    }
    setModel(m.id);
    setIsModelSelectorOpen(false);
  };

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setError(null);

    try {
      const isCustomMode = activeTab === 'custom';
      const result = await createMusicTask({
        prompt: isCustomMode ? lyrics.trim() : prompt.trim(),
        model,
        isPublic,
        instrumental: isInstrumental,
        customMode: isCustomMode,
        style: isCustomMode ? style.trim() || undefined : undefined,
        title: isCustomMode ? title.trim() || undefined : undefined,
        vocalGender: isCustomMode && vocalGender ? vocalGender : undefined,
      });

      if (result.status === 'FAILURE') {
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to create music task');
        setIsGenerating(false);
        return;
      }

      // Task created successfully
      setCurrentTaskId(result.task_id);
      setTaskCreatedAt(new Date());
      setGeneratingProgress(result.progress || 10);

      // Clear draft
      setPrompt('');
      setLyrics('');
      setStyle('');
      setTitle_('');
      setVocalGender('');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to generate music');
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, user, activeTab, lyrics, prompt, model, isPublic, isInstrumental, style, title, vocalGender]);

  // Poll task status
  useEffect(() => {
    if (!currentTaskId || generatingStatus !== 'generating') return;

    const pollInterval = setInterval(async () => {
      // Timeout check: stop polling after 30 minutes
      if (taskCreatedAt) {
        const taskAgeMinutes = (Date.now() - taskCreatedAt.getTime()) / 1000 / 60;
        if (taskAgeMinutes >= 30) {
          setGeneratingStatus('error');
          setGeneratingError('Generation timed out. Please check your history later.');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          return;
        }
      }

      try {
        const status = await getMusicTaskStatus(currentTaskId);
        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS') {
          setGeneratingStatus('success');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          void refreshCredits();
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Generation failed');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
        }
      } catch (err) {
        console.error('Poll status failed:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentTaskId, generatingStatus, taskCreatedAt, refreshCredits]);

  // Reset status
  const handleResetStatus = () => {
    setGeneratingStatus('idle');
    setGeneratingError(null);
    setGeneratingProgress(0);
  };

  // View history
  const handleViewHistory = () => {
    router.push('/studio/music-history');
  };

  // Generate Lyrics with AI (also generates title)
  const handleGenerateLyrics = async () => {
    if (!lyricsPrompt.trim()) return;

    setIsGeneratingLyrics(true);
    try {
      const response = await fetch('/api/ai/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lyricsPrompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate lyrics');
      }

      if (data.lyrics) {
        setLyrics(data.lyrics);
      }
      if (data.title) {
        setTitle_(data.title);
      }
      setIsLyricsAssistantOpen(false);
      setLyricsPrompt('');
    } catch (err) {
      console.error('Generate lyrics failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate lyrics');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // Generate Style with AI
  const handleGenerateStyle = async () => {
    if (!stylePrompt.trim()) return;

    setIsGeneratingStyle(true);
    try {
      const response = await fetch('/api/ai/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: stylePrompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate style');
      }

      if (data.style) {
        setStyle(data.style);
      }
      setIsStyleAssistantOpen(false);
      setStylePrompt('');
    } catch (err) {
      console.error('Generate style failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate style');
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  // Generate Prompt with AI (for Simple mode)
  const handleGeneratePrompt = async () => {
    if (!promptAssistantInput.trim()) return;

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptAssistantInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      if (data.prompt) {
        setPrompt(data.prompt);
      }
      setIsPromptAssistantOpen(false);
      setPromptAssistantInput('');
    } catch (err) {
      console.error('Generate prompt failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const tabs: { id: MusicTab; label: string }[] = [
    { id: 'custom', label: 'Lyrics to Music' },
    { id: 'simple', label: 'Prompt to Music' },
  ];

  return (
    <>
      {/* Desktop Layout - Two Column */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column: Controls */}
            <div className="col-span-7 flex flex-col gap-4 min-h-0">
              {/* Model Selector Card - Fixed Top */}
              <div className="flex-shrink-0 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-3">{t('studio.menu.aiMusic')} Model</div>
                <button
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {selectedModel?.name || model}
                        {selectedModel?.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-gray-500">{selectedModel?.description}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    Latest
                  </span>
                </button>
              </div>

              {/* Settings Card - Scrollable Middle */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content - Simple Mode */}
                {activeTab === 'simple' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Prompt</span>
                          <button
                            onClick={() => setIsPromptAssistantOpen(true)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Prompt</span>
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">{prompt.length}/{maxPromptCharacters}</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={prompt}
                          onChange={(e) => e.target.value.length <= maxPromptCharacters && setPrompt(e.target.value)}
                          placeholder="A chinese song about summer rain, jazz, mellow, warm, sung by a male voice"
                          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          disabled={isGenerating}
                        />
                        {prompt.length > 0 && (
                          <button
                            onClick={() => setPrompt('')}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-lg shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content - Custom Mode */}
                {activeTab === 'custom' && (
                  <div className="space-y-4">
                    {/* Reference Audio */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Reference Audio</span>
                        <span className="text-xs text-gray-400">(optional)</span>
                      </div>
                      <button className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Upload or record audio</span>
                      </button>
                    </div>

                    {/* Lyrics */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Lyrics</span>
                          <button
                            onClick={() => setIsLyricsAssistantOpen(true)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Lyrics</span>
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">{lyrics.length}/{maxLyricsCharacters}</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={lyrics}
                          onChange={(e) => e.target.value.length <= maxLyricsCharacters && setLyrics(e.target.value)}
                          placeholder={"Enter your lyrics here...\n\n[Verse 1]\nWrite your first verse\n\n[Chorus]\nWrite your chorus"}
                          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          disabled={isGenerating}
                        />
                        {lyrics.length > 0 && (
                          <button
                            onClick={() => setLyrics('')}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-lg shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Style */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Style</span>
                          <span className="text-xs text-gray-400">(optional)</span>
                          <button
                            onClick={() => setIsStyleAssistantOpen(true)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Style</span>
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="pop, rock, jazz, electronic..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Title</span>
                        <span className="text-xs text-gray-400">(optional)</span>
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle_(e.target.value)}
                        placeholder="Give your song a title"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Voice Gender */}
                    {!isInstrumental && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Voice</div>
                        <div className="flex gap-2">
                          {[
                            { value: '' as const, label: 'Auto', activeClass: 'bg-gray-600' },
                            { value: 'm' as const, label: 'Male', activeClass: 'bg-purple-600' },
                            { value: 'f' as const, label: 'Female', activeClass: 'bg-pink-500' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setVocalGender(option.value)}
                              disabled={isGenerating}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                vocalGender === option.value
                                  ? `${option.activeClass} text-white`
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } disabled:opacity-50`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Parameters */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Visibility</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsPublic(true)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isPublic ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => setIsPublic(false)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          !isPublic ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Private
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-600">Instrumental</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsInstrumental(false)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          !isInstrumental ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => setIsInstrumental(true)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isInstrumental ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        On
                      </button>
                    </div>
                  </div>
                </div>

                </div>
              </div>

              {/* Generate Button Card - Fixed Bottom */}
              <div className="flex-shrink-0 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <GradientButton
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate}
                  fullWidth
                  size="lg"
                  variant="pink-rose"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span>Generate</span>
                    </div>
                  )}
                </GradientButton>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="col-span-5 flex flex-col gap-4">
              <div className="text-lg font-semibold text-gray-900">Preview</div>
              <div className="flex-1 bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl border border-pink-200 flex items-center justify-center min-h-[400px]">
                {generatingStatus === 'generating' ? (
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200">
                      <Music className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h3 className="text-gray-900 font-semibold text-lg mb-2">Generating music...</h3>
                    {generatingProgress > 0 && (
                      <div className="mb-3">
                        <div className="w-48 h-2 bg-pink-200 rounded-full overflow-hidden mx-auto">
                          <div
                            className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-300"
                            style={{ width: `${generatingProgress}%` }}
                          />
                        </div>
                        <p className="text-pink-600 text-sm font-medium mt-2">{generatingProgress}%</p>
                      </div>
                    )}
                    <p className="text-gray-500 text-sm">
                      Estimated time: <span className="text-pink-600 font-medium">3-5 minutes</span>
                    </p>
                  </div>
                ) : generatingStatus === 'success' ? (
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-gray-900 font-semibold text-lg mb-2">Music Created!</h3>
                    <p className="text-gray-500 text-sm mb-6">Your music has been generated successfully.</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleResetStatus}
                        className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                      >
                        Create Another
                      </button>
                      <button
                        onClick={handleViewHistory}
                        className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                      >
                        View History
                      </button>
                    </div>
                  </div>
                ) : generatingStatus === 'error' ? (
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-gray-900 font-semibold text-lg mb-2">Generation Failed</h3>
                    <p className="text-red-500 text-sm mb-6">{generatingError || 'Something went wrong.'}</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleResetStatus}
                        className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          handleResetStatus();
                          void handleGenerate();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/60 flex items-center justify-center border border-pink-200">
                      <Music className="w-10 h-10 text-pink-300" />
                    </div>
                    <p className="text-gray-400">Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col bg-gradient-to-b from-white to-purple-50 min-h-[calc(100vh-60px)]">
        <div className="flex-1 px-4 py-4 space-y-4 pb-24">
          {/* Model Selector */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <button
              onClick={() => setIsModelSelectorOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">{selectedModel?.name || model}</span>
                {selectedModel?.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Tab Content */}
            {activeTab === 'simple' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Prompt</span>
                    <button
                      onClick={() => setIsPromptAssistantOpen(true)}
                      disabled={isGenerating}
                      className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{prompt.length}/{maxPromptCharacters}</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => e.target.value.length <= maxPromptCharacters && setPrompt(e.target.value)}
                  placeholder="A chinese song about summer rain, jazz, mellow, warm..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isGenerating}
                />
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-4">
                {/* Lyrics */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Lyrics</span>
                      <button
                        onClick={() => setIsLyricsAssistantOpen(true)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">{lyrics.length}/{maxLyricsCharacters}</span>
                  </div>
                  <textarea
                    value={lyrics}
                    onChange={(e) => e.target.value.length <= maxLyricsCharacters && setLyrics(e.target.value)}
                    placeholder={"Enter your lyrics here...\n\n[Verse 1]\nWrite your first verse"}
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={isGenerating}
                  />
                </div>

                {/* Style */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Style</span>
                      <span className="text-xs text-gray-400">(optional)</span>
                      <button
                        onClick={() => setIsStyleAssistantOpen(true)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="pop, rock, jazz..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400"
                    disabled={isGenerating}
                  />
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Title</span>
                    <span className="text-xs text-gray-400">(optional)</span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle_(e.target.value)}
                    placeholder="Song title"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400"
                    disabled={isGenerating}
                  />
                </div>

                {/* Voice */}
                {!isInstrumental && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Voice</div>
                    <div className="flex gap-2">
                      {[
                        { value: '' as const, label: 'Auto' },
                        { value: 'm' as const, label: 'Male' },
                        { value: 'f' as const, label: 'Female' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setVocalGender(option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            vocalGender === option.value
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Generation Status (Mobile) */}
          {generatingStatus !== 'idle' && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              {generatingStatus === 'generating' && (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-spin" />
                  <p className="text-gray-900 font-medium">Generating music...</p>
                  {generatingProgress > 0 && (
                    <p className="text-purple-600 text-sm">{generatingProgress}%</p>
                  )}
                </div>
              )}
              {generatingStatus === 'success' && (
                <div className="text-center">
                  <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-gray-900 font-medium mb-3">Music Created!</p>
                  <button
                    onClick={handleViewHistory}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium"
                  >
                    View History
                  </button>
                </div>
              )}
              {generatingStatus === 'error' && (
                <div className="text-center">
                  <X className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-gray-900 font-medium mb-1">Generation Failed</p>
                  <p className="text-red-500 text-sm mb-3">{generatingError}</p>
                  <button
                    onClick={handleResetStatus}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
          <GradientButton
            onClick={() => void handleGenerate()}
            disabled={!canGenerate}
            fullWidth
            size="lg"
            variant="pink-rose"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Generate</span>
              </div>
            )}
          </GradientButton>
        </div>
      </div>

      {/* Model Selector Modal */}
      {isModelSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModelSelectorOpen(false)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Model</h3>
              <button onClick={() => setIsModelSelectorOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {musicModelsConfig.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    model === m.id
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-900">{m.name}</span>
                      {m.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        {m.credits} credits
                      </span>
                      {model === m.id && <Check className="w-5 h-5 text-purple-600" />}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm pl-7">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Lyrics Assistant Modal */}
      {isLyricsAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLyricsAssistantOpen(false)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Lyrics Assistant</h3>
              <button onClick={() => setIsLyricsAssistantOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Describe the theme, mood, or story you want for your lyrics. The AI will generate creative lyrics and a title for you.
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your idea</span>
                  <span className="text-xs text-gray-400">{lyricsPrompt.length}/500</span>
                </div>
                <textarea
                  value={lyricsPrompt}
                  onChange={(e) => e.target.value.length <= 500 && setLyricsPrompt(e.target.value)}
                  placeholder="e.g., A love song about missing someone in autumn, melancholic but hopeful..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isGeneratingLyrics}
                />
              </div>
              <GradientButton
                onClick={() => void handleGenerateLyrics()}
                disabled={!lyricsPrompt.trim() || isGeneratingLyrics}
                fullWidth
                size="lg"
              >
                {isGeneratingLyrics ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Lyrics</span>
                  </div>
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Style Assistant Modal */}
      {isStyleAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsStyleAssistantOpen(false)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Style Assistant</h3>
              <button onClick={() => setIsStyleAssistantOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Describe your song&apos;s mood, theme, or reference artists. AI will generate style tags for you.
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your idea</span>
                  <span className="text-xs text-gray-400">{stylePrompt.length}/500</span>
                </div>
                <textarea
                  value={stylePrompt}
                  onChange={(e) => e.target.value.length <= 500 && setStylePrompt(e.target.value)}
                  placeholder="e.g., An energetic dance track like Dua Lipa, with synth and strong beats..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isGeneratingStyle}
                />
              </div>
              <GradientButton
                onClick={() => void handleGenerateStyle()}
                disabled={!stylePrompt.trim() || isGeneratingStyle}
                fullWidth
                size="lg"
              >
                {isGeneratingStyle ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Style</span>
                  </div>
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Assistant Modal */}
      {isPromptAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPromptAssistantOpen(false)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Prompt Assistant</h3>
              <button onClick={() => setIsPromptAssistantOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Describe your song idea briefly. AI will expand it into a detailed music generation prompt.
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your idea</span>
                  <span className="text-xs text-gray-400">{promptAssistantInput.length}/500</span>
                </div>
                <textarea
                  value={promptAssistantInput}
                  onChange={(e) => e.target.value.length <= 500 && setPromptAssistantInput(e.target.value)}
                  placeholder="e.g., A happy summer song, a sad love ballad, an energetic workout track..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isGeneratingPrompt}
                />
              </div>
              <GradientButton
                onClick={() => void handleGeneratePrompt()}
                disabled={!promptAssistantInput.trim() || isGeneratingPrompt}
                fullWidth
                size="lg"
              >
                {isGeneratingPrompt ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Prompt</span>
                  </div>
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
