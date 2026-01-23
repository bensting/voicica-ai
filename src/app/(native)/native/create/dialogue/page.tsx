'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import LoginModal from '@/components/native/LoginModal';
import CreateSheet from '@/components/native/CreateSheet';
import { calculateDialogueCost } from '@/config/creditsCost';
import { getElevenlabsDialogueVoices } from '@/actions/admin/elevenlabs-dialogue-voices';
import { createDialogueTask, getDialogueTaskStatus } from '@/actions/dialogue';

// localStorage key
const STORAGE_KEY = 'dialogue_draft';

// 对话片段类型
interface DialogueSegment {
  id: string;
  text: string;
  voice: string;
}

// 情绪标签
const EMOTIONS = [
  { tag: '[excitedly]', label: 'excitedly' },
  { tag: '[whispers]', label: 'whispers' },
  { tag: '[laughs]', label: 'laughs' },
  { tag: '[sarcastic]', label: 'sarcastic' },
  { tag: '[sighs]', label: 'sighs' },
  { tag: '[sad]', label: 'sad' },
];

// 声音类型
interface Voice {
  id: string;
  name: string;
  display_name: string;
  gender: string;
  avatar_url: string;
}

// 默认声音（数据库加载失败时使用）
const DEFAULT_VOICES: Voice[] = [
  { id: 'Liam', name: 'elevenlabs_dialogue:Liam', display_name: 'Liam', gender: 'male', avatar_url: '' },
  { id: 'Jessica', name: 'elevenlabs_dialogue:Jessica', display_name: 'Jessica', gender: 'female', avatar_url: '' },
];

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

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/**
 * Native Text to Dialogue 页面
 * 多角色对话生成
 */
export default function NativeDialoguePage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [dialogues, setDialogues] = useState<DialogueSegment[]>([
    { id: '1', text: '', voice: 'Liam' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeVoiceSelector, setActiveVoiceSelector] = useState<string | null>(null);

  // 声音列表
  const [voices, setVoices] = useState<Voice[]>(DEFAULT_VOICES);
  const [loadingVoices, setLoadingVoices] = useState(true);

  // 生成状态
  const [, setTaskId] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 总字符限制
  const maxTotalCharacters = 5000;

  // 计算总字符数
  const totalCharacters = dialogues.reduce((sum, d) => sum + d.text.length, 0);

  // 加载声音列表
  const loadVoices = useCallback(async () => {
    setLoadingVoices(true);
    try {
      const result = await getElevenlabsDialogueVoices();
      if (result.length > 0) {
        setVoices(result);
      }
    } catch (error) {
      console.error('加载声音列表失败:', error);
    } finally {
      setLoadingVoices(false);
    }
  }, []);

  // 初始化加载声音
  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  // 从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDialogues(parsed);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dialogues));
  }, [dialogues]);

  // 添加对话
  const addDialogue = () => {
    const newId = Date.now().toString();
    setDialogues([...dialogues, { id: newId, text: '', voice: 'jessica' }]);
  };

  // 删除对话
  const removeDialogue = (id: string) => {
    if (dialogues.length > 1) {
      setDialogues(dialogues.filter(d => d.id !== id));
    }
  };

  // 更新对话文本
  const updateDialogueText = (id: string, text: string) => {
    const otherChars = dialogues.filter(d => d.id !== id).reduce((sum, d) => sum + d.text.length, 0);
    if (otherChars + text.length <= maxTotalCharacters) {
      setDialogues(dialogues.map(d => d.id === id ? { ...d, text } : d));
      setError(null);
    }
  };

  // 插入情绪标签到对话
  const insertEmotion = (id: string, tag: string) => {
    const dialogue = dialogues.find(d => d.id === id);
    if (!dialogue) return;
    const newText = tag + ' ' + dialogue.text;
    updateDialogueText(id, newText);
  };

  // 更新对话语音
  const updateDialogueVoice = (id: string, voice: string) => {
    setDialogues(dialogues.map(d => d.id === id ? { ...d, voice } : d));
    setActiveVoiceSelector(null);
  };

  // 获取语音信息
  const getVoice = (voiceId: string) => {
    return voices.find(v => v.id === voiceId);
  };

  // 获取语音名称
  const getVoiceName = (voiceId: string) => {
    return getVoice(voiceId)?.display_name || voiceId;
  };

  // 预估积分消耗
  const estimatedCredits = calculateDialogueCost(totalCharacters);

  // 是否可以生成
  const canGenerate = dialogues.some(d => d.text.trim().length > 0) && !isGenerating;

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (id: string) => {
    try {
      const status = await getDialogueTaskStatus(id);

      if (status.status === 'completed' && status.audioUrl) {
        setGeneratedAudioUrl(status.audioUrl);
        setIsGenerating(false);
        setTaskId(null);
        refreshCredits();
        // 清除轮询
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (status.status === 'failed') {
        setError(status.error || 'Generation failed');
        setIsGenerating(false);
        setTaskId(null);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      // pending/processing 继续轮询
    } catch (err) {
      console.error('Poll status error:', err);
    }
  }, [refreshCredits]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAudioUrl(null);

    try {
      // 构建对话数据
      const dialogueData = dialogues
        .filter(d => d.text.trim().length > 0)
        .map(d => ({
          text: d.text,
          voice: d.voice, // voice ID like 'Adam', 'Brian', etc.
        }));

      if (dialogueData.length === 0) {
        setError('请输入对话内容');
        setIsGenerating(false);
        return;
      }

      // 创建任务
      const result = await createDialogueTask({
        dialogue: dialogueData,
        stability: 0.5,
      });

      setTaskId(result.taskId);

      // 开始轮询
      pollingRef.current = setInterval(() => {
        pollTaskStatus(result.taskId);
      }, 3000);

      // 立即执行一次
      setTimeout(() => pollTaskStatus(result.taskId), 1000);
    } catch (err) {
      console.error('Dialogue task creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-[#0a0a1a] flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)', height: 'calc(56px + var(--safe-area-inset-top, 0px))' }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="flex items-center gap-1 text-white font-semibold"
        >
          <span>Text to Dialogue</span>
          <ChevronDownIcon />
        </button>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{
          paddingTop: 'calc(56px + var(--safe-area-inset-top, 0px) + 16px)',
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Generated Audio */}
        {generatedAudioUrl && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium text-sm">Generated Dialogue</span>
              <a
                href={generatedAudioUrl}
                download="dialogue.mp3"
                className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
              >
                Download
              </a>
            </div>
            <audio controls className="w-full" src={generatedAudioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Total Characters */}
        <div className="mb-3">
          <span className="text-gray-400 text-xs">
            Total: {totalCharacters} / {maxTotalCharacters} characters
          </span>
        </div>

        {/* Dialogue Segments */}
        <div className="space-y-4 mb-4">
          {dialogues.map((dialogue, index) => (
            <div
              key={dialogue.id}
              className="bg-gray-800/60 rounded-2xl p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">Dialogue {index + 1}</span>
                {dialogues.length > 1 && (
                  <button
                    onClick={() => removeDialogue(dialogue.id)}
                    className="px-3 py-1 text-gray-400 text-xs border border-gray-600 rounded-full hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Text Input */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1.5 block">
                  text <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={dialogue.text}
                  onChange={(e) => updateDialogueText(dialogue.id, e.target.value)}
                  placeholder="Hey! Have you tried this?"
                  className="w-full h-24 bg-gray-900/60 text-white placeholder-gray-600 rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                  disabled={isGenerating}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.tag}
                      onClick={() => insertEmotion(dialogue.id, emotion.tag)}
                      disabled={isGenerating}
                      className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded hover:bg-gray-600/50 hover:text-gray-300 transition-colors disabled:opacity-50"
                    >
                      {emotion.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selector */}
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">
                  voice <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveVoiceSelector(activeVoiceSelector === dialogue.id ? null : dialogue.id)}
                    className="flex-1 flex items-center justify-between bg-gray-900/60 text-white rounded-xl p-3 text-sm"
                  >
                    <span>{getVoiceName(dialogue.voice)}</span>
                    <ChevronDownIcon />
                  </button>
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-gray-900/60 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <PlayIcon />
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Select the voice character for this dialogue.
                </p>

                {/* Voice Options Dropdown */}
                {activeVoiceSelector === dialogue.id && (
                  <div className="mt-2 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 max-h-60 overflow-y-auto">
                    {loadingVoices ? (
                      <div className="px-3 py-4 text-center text-gray-500 text-sm">
                        Loading voices...
                      </div>
                    ) : (
                      voices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => updateDialogueVoice(dialogue.id, voice.id)}
                          className={`w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-gray-800 transition-colors ${
                            dialogue.voice === voice.id ? 'bg-purple-500/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {voice.avatar_url ? (
                              <Image
                                src={voice.avatar_url}
                                alt={voice.display_name}
                                width={28}
                                height={28}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  {voice.gender === 'male' ? '♂' : '♀'}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-white text-sm">{voice.display_name}</span>
                              <span className="text-gray-500 text-xs ml-2 capitalize">{voice.gender}</span>
                            </div>
                          </div>
                          {dialogue.voice === voice.id && (
                            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Dialogue Button */}
        <button
          onClick={addDialogue}
          disabled={isGenerating}
          className="w-full py-3 border-2 border-dashed border-gray-700 rounded-2xl text-gray-400 flex items-center justify-center gap-2 hover:border-gray-600 hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <PlusIcon />
          <span>Add Dialogue</span>
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
          creditRules={[{ name: 'Dialogue generation', description: '100 chars = 3 credits' }]}
          className="mb-3"
        />

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
              <span>Generate Dialogue</span>
              {estimatedCredits > 0 && totalCharacters > 0 && (
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
    </div>
  );
}
