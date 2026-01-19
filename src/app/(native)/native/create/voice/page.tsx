'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { createTtsTask } from '@/actions/tts';
import type { Voice } from '@/types/voice';
import { calculateVoiceCost, type VoiceType } from '@/config/creditsCost';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import NativeVoiceSelectorSheet from '@/components/native/create/voice/VoiceSelectorSheet';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 计算预计消耗积分
  const estimatedCredits = (() => {
    const trimmedText = text?.trim() || '';
    if (trimmedText.length === 0 || !selectedVoice) return 0;

    const mapRoleToVoiceType = (role: string): VoiceType => {
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'celebrity') return 'celebrity';
      if (normalizedRole === 'professional') return 'professional';
      if (normalizedRole === 'special') return 'special';
      if (normalizedRole === 'clone') return 'clone';
      return 'standard';
    };

    const voiceType = mapRoleToVoiceType(selectedVoice.role);
    return calculateVoiceCost(trimmedText.length, voiceType);
  })();

  // 是否可以生成
  const canGenerate = text.trim().length > 0 && selectedVoice !== null && !isGenerating;

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate || !selectedVoice) return;

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
        <h1 className="text-white font-semibold">AI TTS</h1>
        <div className="w-10" /> {/* Placeholder for alignment */}
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
        <div className="flex-1 flex flex-col bg-gray-800/60 rounded-2xl p-4 mb-3 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Enter your text</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">
                {text.length}/{maxCharacters}
              </span>
              {text.length > 0 && (
                <button
                  onClick={handleClearText}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-1 w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-sm leading-relaxed"
            disabled={isGenerating}
          />
        </div>

        {/* Voice Selector Button */}
        <button
          onClick={() => setIsVoiceSelectorOpen(true)}
          disabled={isGenerating}
          className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl mb-3 disabled:opacity-50"
        >
          {selectedVoice?.avatar_url ? (
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

        {/* Credits Info */}
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <CreditsIcon className="w-3.5 h-3.5" />
            <span>Balance: {credits}</span>
          </div>
          {estimatedCredits > 0 && (
            <div className="text-gray-400 text-xs">
              Cost: {estimatedCredits}
            </div>
          )}
        </div>

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

      {/* Bottom safe area */}
      <div
        className="flex-shrink-0"
        style={{ height: 'var(--safe-area-inset-bottom, 0px)' }}
      />

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
    </div>
  );
}
