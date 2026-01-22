'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useAudioSettings } from '@/contexts/AudioSettingsContext';
import { AUDIO_SETTINGS_RANGE } from '@/types/audioSettings';
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

// 垃圾桶图标
const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
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

// 设置图标
const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// 速度图标
const SpeedIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// 音量图标
const VolumeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);

// 音调图标
const PitchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </svg>
);

// 关闭图标
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Native TTS 页面
 */
export default function NativeTTSPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();
  const { settings, updateSettings } = useAudioSettings();

  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'speed' | 'volume' | 'pitch'>('speed');
  const [tempSettings, setTempSettings] = useState(settings);
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

  // 同步 settings 到 tempSettings
  useEffect(() => {
    if (isSettingsOpen) {
      setTempSettings(settings);
    }
  }, [settings, isSettingsOpen]);

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
        speed: settings.speed,
        volume: settings.volume,
        pitch: settings.pitch,
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

  // 获取音调标签
  const getPitchLabel = (value: number) => {
    if (value <= 10) return 'Deep';
    if (value <= 35) return 'Dull';
    if (value <= 65) return 'Consistent';
    if (value <= 90) return 'Bright';
    return 'Crisp';
  };

  // 保存音频设置
  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setIsSettingsOpen(false);
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
          <span>Text to Voice</span>
          <ChevronDownIcon />
        </button>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col px-4 min-h-0"
        style={{ paddingBottom: 'calc(100px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex-shrink-0">
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
          containerClassName="flex-1 flex flex-col min-h-0"
          inputClassName="flex-1 min-h-[120px] leading-relaxed"
          rightActions={
            <button
              onClick={handleClearText}
              disabled={text.length === 0}
              className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <TrashIcon />
            </button>
          }
        />

        {/* Voice Selector Button */}
        <button
          onClick={() => setIsVoiceSelectorOpen(true)}
          disabled={isGenerating}
          className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl disabled:opacity-50 flex-shrink-0"
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

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          disabled={isGenerating}
          className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl disabled:opacity-50 flex-shrink-0 mt-3"
        >
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
            <SettingsIcon />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-medium">Audio Settings</div>
            <div className="text-gray-400 text-xs">
              Speed {settings.speed}x · Volume {settings.volume}% · Pitch {settings.pitch}
            </div>
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
          creditRules={[{ name: 'Voice generation', description: '100 chars = 1 credit' }]}
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

      {/* Audio Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="w-full bg-[#1a1a2e] rounded-t-3xl shadow-xl"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with tabs */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-4 pt-4">
              <div className="flex space-x-2">
                {[
                  { id: 'speed' as const, icon: <SpeedIcon />, label: 'Speed' },
                  { id: 'volume' as const, icon: <VolumeIcon />, label: 'Volume' },
                  { id: 'pitch' as const, icon: <PitchIcon />, label: 'Pitch' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                      activeSettingsTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {tab.icon}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Speed Tab */}
              {activeSettingsTab === 'speed' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Speed</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Adjust how fast the voice speaks
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-purple-600/20 text-purple-400 text-2xl font-bold px-6 py-3 rounded-xl">
                      {tempSettings.speed}x
                    </div>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={AUDIO_SETTINGS_RANGE.speed.min}
                      max={AUDIO_SETTINGS_RANGE.speed.max}
                      step={AUDIO_SETTINGS_RANGE.speed.step}
                      value={tempSettings.speed}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, speed: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{AUDIO_SETTINGS_RANGE.speed.min}x</span>
                      <span>{AUDIO_SETTINGS_RANGE.speed.max}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Tab */}
              {activeSettingsTab === 'volume' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Volume</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Adjust the output volume level
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-purple-600/20 text-purple-400 text-2xl font-bold px-6 py-3 rounded-xl">
                      {tempSettings.volume}%
                    </div>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={AUDIO_SETTINGS_RANGE.volume.min}
                      max={AUDIO_SETTINGS_RANGE.volume.max}
                      step={AUDIO_SETTINGS_RANGE.volume.step}
                      value={tempSettings.volume}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, volume: parseInt(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{AUDIO_SETTINGS_RANGE.volume.min}%</span>
                      <span>{AUDIO_SETTINGS_RANGE.volume.max}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pitch Tab */}
              {activeSettingsTab === 'pitch' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Pitch</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Adjust the voice tone
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-purple-600/20 text-purple-400 text-2xl font-bold px-6 py-3 rounded-xl">
                      {tempSettings.pitch}
                    </div>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={AUDIO_SETTINGS_RANGE.pitch.min}
                      max={AUDIO_SETTINGS_RANGE.pitch.max}
                      step={AUDIO_SETTINGS_RANGE.pitch.step}
                      value={tempSettings.pitch}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, pitch: parseInt(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Deep</span>
                      <span>Dull</span>
                      <span>Consistent</span>
                      <span>Bright</span>
                      <span>Crisp</span>
                    </div>
                    <div className="text-center mt-2 text-sm font-medium text-purple-400">
                      {getPitchLabel(tempSettings.pitch)}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                className="w-full mt-6 bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
