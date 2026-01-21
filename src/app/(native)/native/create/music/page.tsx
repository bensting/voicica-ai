'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import LoginModal from '@/components/native/LoginModal';
import CreateSheet from '@/components/native/CreateSheet';
import {
  musicModelsConfig,
  defaultMusicModelId,
  getMusicModelById,
  type MusicModel,
} from '@/config/native/musicModels';
import { createMusicTask } from '@/actions/music';

// localStorage key
const STORAGE_KEY = 'music_draft';

// Tab 类型
type MusicTab = 'simple' | 'custom' | 'cover' | 'dedicate';

// 图标组件
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

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

const MusicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06l-4.63 1.22-3.15-5.14c-.45-.74-1.44-.96-2.19-.51-.27.16-.49.4-.62.68L6.5 9.8l-4.63-1.22c-.8-.22-1.63.26-1.84 1.06-.1.34-.04.72.14 1.03l4.85 8.13c.16.27.44.44.75.52.13.03.26.05.39.05h11.68c.13 0 .26-.02.39-.05.31-.08.59-.25.75-.52l4.85-8.13c.18-.31.24-.69.14-1.03z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const AssistantIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#6366f1" />
    <circle cx="8" cy="10" r="1.5" fill="white" />
    <circle cx="16" cy="10" r="1.5" fill="white" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4H8z" fill="white" />
  </svg>
);

/**
 * Native AI Music 页面
 */
export default function NativeMusicPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();
  const { isSubscribed } = useSubscription();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<MusicTab>('simple');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(defaultMusicModelId);
  const [isPublic, setIsPublic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 字符限制
  const maxCharacters = 3000;

  // 从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.model) setModel(parsed.model);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt, model, activeTab }));
  }, [prompt, model, activeTab]);

  // 处理文本变化
  const handlePromptChange = (text: string) => {
    if (text.length <= maxCharacters) {
      setPrompt(text);
      setError(null);
    }
  };

  // 清空文本
  const handleClearPrompt = () => {
    setPrompt('');
    setError(null);
  };

  // 获取当前选中的模型
  const selectedModel = getMusicModelById(model);

  // 预估积分消耗（根据选中的模型）
  const estimatedCredits = prompt.trim().length > 0 ? (selectedModel?.credits ?? 30) : 0;

  // 处理模型选择
  const handleModelSelect = (m: MusicModel) => {
    // 如果是 Premium 模型且用户未订阅，跳转到订阅页面
    if (m.isPremium && !isSubscribed) {
      setIsModelSelectorOpen(false);
      router.push('/native/subscribe');
      return;
    }
    setModel(m.id);
    setIsModelSelectorOpen(false);
  };

  // 是否可以生成
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await createMusicTask({
        prompt: prompt.trim(),
        model,
        isPublic,
      });

      if (result.status === 'FAILURE') {
        setError(result.error || 'Failed to create music task');
        setIsGenerating(false);
        return;
      }

      // 任务创建成功，跳转到历史页面或显示成功提示
      // 清空草稿
      setPrompt('');
      localStorage.removeItem(STORAGE_KEY);

      // 跳转到音乐历史页面
      router.push('/native/me?tab=music');
    } catch (err) {
      console.error('Music generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate music');
      setIsGenerating(false);
    }
  };

  const tabs: { id: MusicTab; label: string }[] = [
    { id: 'simple', label: 'Simple' },
    { id: 'custom', label: 'Custom' },
    { id: 'cover', label: 'Cover' },
    { id: 'dedicate', label: 'Dedicate' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-white">
            <BackIcon />
          </button>
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex items-center gap-1 text-white font-semibold"
          >
            <span>AI Music</span>
            <ChevronDownIcon />
          </button>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-transparent text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto px-4"
        style={{
          paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 120px)',
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
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
            <button
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="flex items-center gap-1.5 text-gray-400 text-sm"
            >
              <SettingsIcon />
              <span>{selectedModel?.name || model}</span>
              {selectedModel?.isPremium && (
                <span className="text-yellow-400">
                  <CrownIcon />
                </span>
              )}
              <ChevronDownIcon />
            </button>
          </div>


          {/* Prompt Input */}
          <div className="bg-gray-800/60 rounded-2xl overflow-hidden">
            <textarea
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="A chinese song about summer rain,jazz,mellow,warm,sung by a male voice"
              className="w-full h-48 bg-transparent text-white placeholder-gray-500 p-4 resize-none focus:outline-none text-sm leading-relaxed"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700/50">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 rounded-full text-gray-300 text-xs">
                <AssistantIcon />
                <span>Assistant</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{prompt.length}/{maxCharacters}</span>
                <button
                  onClick={handleClearPrompt}
                  disabled={prompt.length === 0}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Parameters</span>
            <button className="flex items-center gap-1 text-gray-400 text-xs">
              <span>Credits Rule</span>
              <InfoIcon />
            </button>
          </div>

          {/* Public/Private Toggle */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <ShieldIcon />
              <span className="text-white text-sm">{isPublic ? 'Public' : 'Private'}</span>
            </div>
            <ChevronDownIcon />
          </button>
        </div>

        {/* Credits Info */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs px-1">
          <CreditsIcon className="w-3.5 h-3.5" />
          <span>Credits: {credits}</span>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>Create</span>
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

      {/* Create Sheet */}
      <CreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      {/* Model Selector Sheet */}
      {isModelSelectorOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModelSelectorOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-white font-semibold text-lg">Select Model</h3>
              <button
                onClick={() => setIsModelSelectorOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Model Options */}
            <div className="px-4 pb-6 space-y-3">
              {musicModelsConfig.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m)}
                  className={`w-full p-4 rounded-2xl text-left transition-colors ${
                    model === m.id
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-gray-800/60 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SettingsIcon />
                      <span className="text-white font-medium">{m.name}</span>
                      {m.isPremium && (
                        <span className="text-yellow-400">
                          <CrownIcon />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        <CreditsIcon className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400 text-xs font-medium">{m.credits}</span>
                      </div>
                      {model === m.id && (
                        <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm pl-7">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
