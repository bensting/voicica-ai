'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { createTtsTask } from '@/actions/tts';
import type { Voice } from '@/types/voice';
import { calculateVoiceCost, type VoiceType } from '@/config/creditsCost';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import AssistantInput from '@/components/native/common/AssistantInput';
import AssistantModal from '@/components/native/common/AssistantModal';
import NativeVoiceSelectorSheet from '@/components/native/create/voice/VoiceSelectorSheet';
import LoginModal from '@/components/native/LoginModal';
import CreateSheet from '@/components/native/CreateSheet';

// localStorage keys
const STORAGE_KEY_TEXT = 'tts_draft_text';
const STORAGE_KEY_VOICE = 'tts_draft_voice';

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

// 清除图标
const ClearIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// 箭头图标
const ChevronIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// 麦克风图标
const MicIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

/**
 * Native TTS 页面
 */
export default function NativeTTSPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();

  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Text assistant modal states
  const [isTextAssistantOpen, setIsTextAssistantOpen] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // 从 localStorage 加载保存的文本和语音
  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
    const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);

    if (savedText) {
      setText(savedText);
    }
    if (savedVoice) {
      try {
        setSelectedVoice(JSON.parse(savedVoice));
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存文本到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEXT, text);
  }, [text]);

  // 保存语音到 localStorage
  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem(STORAGE_KEY_VOICE, JSON.stringify(selectedVoice));
    }
  }, [selectedVoice]);

  // 字符限制：匿名用户 500，登录用户 2000
  const maxCharacters = user ? 2000 : 500;

  // 处理文本变化
  const handleTextChange = (newText: string) => {
    if (newText.length <= maxCharacters) {
      setText(newText);
      setError(null);
    }
  };

  // 处理语音选择
  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setError(null);
  };

  // 清空文本
  const handleClearText = () => {
    setText('');
    setError(null);
  };

  // 将 role 转换为 VoiceType
  const mapRoleToVoiceType = (role: string): VoiceType => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'celebrity') return 'celebrity';
    if (normalizedRole === 'professional') return 'professional';
    if (normalizedRole === 'special') return 'special';
    if (normalizedRole === 'clone') return 'clone';
    return 'standard';
  };

  // 计算预计消耗积分（输入文字后即显示，未选择语音时使用 standard 计算）
  const estimatedCredits = (() => {
    const trimmedText = text?.trim() || '';
    if (trimmedText.length === 0) return 0;

    const voiceType = selectedVoice ? mapRoleToVoiceType(selectedVoice.role) : 'standard';
    return calculateVoiceCost(trimmedText.length, voiceType);
  })();

  // 是否可以生成
  const canGenerate = text.trim().length > 0 && selectedVoice !== null && !isGenerating;

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate || !selectedVoice) return;

    // 检查是否已登录
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await createTtsTask({
        text: text.trim(),
        voice_name: selectedVoice.name,
        language: selectedVoice.locale,
      });

      if (result.status === 'FAILURE') {
        // 处理错误
        setError(result.error || 'Failed to create task');
        setIsGenerating(false);
        return;
      }

      // 成功，跳转到任务详情页
      router.push(`/native/voice/task/${result.task_id}`);
    } catch (err) {
      console.error('TTS task creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setIsGenerating(false);
    }
  };

  // 生成文本
  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return;

    setIsGeneratingText(true);
    try {
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textPrompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate text');
      }

      if (data.text) {
        setText(data.text);
        setIsTextAssistantOpen(false);
        setTextPrompt('');
      }
    } catch (err) {
      console.error('Generate text failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate text');
    } finally {
      setIsGeneratingText(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0a1a] flex flex-col"
      style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="flex items-center gap-1 text-white font-semibold"
        >
          <span>AI TTS</span>
          <ChevronDownIcon />
        </button>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Text Input */}
        <AssistantInput
          label="Enter your text"
          placeholder="Type or paste your text here..."
          value={text}
          onChange={handleTextChange}
          maxLength={maxCharacters}
          multiline
          rows={8}
          assistantButtonText="Generate Text"
          onAssistantClick={() => setIsTextAssistantOpen(true)}
          disabled={isGenerating}
          className="flex-1 flex flex-col mb-3 min-h-0"
          containerClassName="flex-1 flex flex-col"
          inputClassName="flex-1 min-h-[150px] leading-relaxed"
          rightActions={
            <button
              onClick={handleClearText}
              disabled={text.length === 0}
              className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ClearIcon />
            </button>
          }
        />

        {/* Voice Selector Button */}
        <button
          onClick={() => setIsVoiceSelectorOpen(true)}
          disabled={isGenerating}
          className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl mb-3 disabled:opacity-50"
        >
          {selectedVoice?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedVoice.avatar_url}
              alt={selectedVoice.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <MicIcon />
            </div>
          )}
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-medium">
              {selectedVoice?.display_name || 'Select a voice'}
            </div>
            {selectedVoice && (
              <div className="text-gray-400 text-xs">
                {selectedVoice.locale} · {selectedVoice.gender}
              </div>
            )}
          </div>
          <ChevronIcon />
        </button>

      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Credits Info Bar */}
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: 'Voice generation', credits: 10 }]}
          className="mb-3"
        />

        {/* Generate Button */}
        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate</span>
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

      {/* Voice Selector Sheet */}
      <NativeVoiceSelectorSheet
        isOpen={isVoiceSelectorOpen}
        onClose={() => setIsVoiceSelectorOpen(false)}
        selectedVoice={selectedVoice}
        onSelect={(voice) => {
          handleVoiceSelect(voice);
          setIsVoiceSelectorOpen(false);
        }}
      />

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

      {/* Text Assistant Modal */}
      <AssistantModal
        isOpen={isTextAssistantOpen}
        onClose={() => setIsTextAssistantOpen(false)}
        title="Text Assistant"
        description="Describe what you want to say and AI will generate the text for you."
        placeholder="e.g., A welcome message for a podcast, a product introduction, a story narration..."
        value={textPrompt}
        onChange={setTextPrompt}
        maxLength={500}
        isGenerating={isGeneratingText}
        onGenerate={() => void handleGenerateText()}
        generateButtonText="Generate Text"
      />
    </div>
  );
}
