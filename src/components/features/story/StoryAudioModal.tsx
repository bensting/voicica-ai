'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Volume2,
  Play,
  Pause,
  Loader2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { createTtsTask, getTtsTaskStatus, updateParagraphAudio } from '@/actions/tts';
import VoiceSelectButton from '@/components/features/studio/tts/components/VoiceSelectButton';
import type { Voice } from '@/types/voice';
import type { UserStory, StoryParagraph } from '@/actions/story';

// 动态导入语音选择器弹窗
const VoiceSelectorBottomSheet = dynamic(
  () => import('@/components/features/studio/tts/components/mobile/VoiceSelectorBottomSheet'),
  { ssr: false }
);

// 段落音频状态类型
interface ParagraphAudioState {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  audioUrl?: string;
}

interface StoryAudioModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

export default function StoryAudioModal({
  story,
  isOpen,
  onClose,
  onSuccess,
  t,
}: StoryAudioModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingParagraphId, setGeneratingParagraphId] = useState<string | null>(null);

  // 段落音频状态追踪
  const [paragraphAudio, setParagraphAudio] = useState<Record<string, ParagraphAudioState>>({});
  // 展开的段落
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set());
  // 当前播放的音频
  const [playingParagraphId, setPlayingParagraphId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 从 localStorage 恢复上次选择的语音
  useEffect(() => {
    if (isOpen && !selectedVoice) {
      const lastVoiceStr = localStorage.getItem('lastSelectedVoice');
      if (lastVoiceStr) {
        try {
          const lastVoice = JSON.parse(lastVoiceStr) as Voice;
          setSelectedVoice(lastVoice);
        } catch (err) {
          console.error('Failed to parse last selected voice:', err);
        }
      }
    }
  }, [isOpen, selectedVoice]);

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 重置状态当 modal 关闭
  useEffect(() => {
    if (!isOpen) {
      setParagraphAudio({});
      setExpandedParagraphs(new Set());
      setPlayingParagraphId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen || !story) return null;

  const handleVoiceSelect = (voice: Voice, style: string | null = null) => {
    setSelectedVoice(voice);
    setSelectedStyle(style);
    setError(null);
    // 保存到 localStorage
    localStorage.setItem('lastSelectedVoice', JSON.stringify(voice));
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, paragraphId: string, voiceName: string) => {
    const maxAttempts = 60; // 最多轮询 60 次（约 2 分钟）
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const result = await getTtsTaskStatus(taskId);

        if (result.status === 'SUCCESS' && result.result) {
          const audioUrl = result.result.audio_url;
          const audioDuration = result.result.duration;

          // 更新本地状态
          setParagraphAudio((prev) => ({
            ...prev,
            [paragraphId]: {
              taskId,
              status: 'SUCCESS',
              audioUrl,
            },
          }));

          // 持久化到数据库
          await updateParagraphAudio({
            paragraphId,
            audioUrl,
            audioDuration,
            voiceName,
          });

          return;
        } else if (result.status === 'FAILURE') {
          setParagraphAudio((prev) => ({
            ...prev,
            [paragraphId]: {
              taskId,
              status: 'FAILURE',
            },
          }));
          return;
        }

        // 继续轮询
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // 每 2 秒轮询一次
        } else {
          // 超时
          setParagraphAudio((prev) => ({
            ...prev,
            [paragraphId]: {
              taskId,
              status: 'FAILURE',
            },
          }));
        }
      } catch (err) {
        console.error('Polling error:', err);
        setParagraphAudio((prev) => ({
          ...prev,
          [paragraphId]: {
            taskId,
            status: 'FAILURE',
          },
        }));
      }
    };

    poll();
  };

  // 批量生成所有未生成音频的段落
  const handleGenerateAll = async () => {
    if (!selectedVoice) {
      setError(t('story.audio.selectVoiceFirst') || 'Please select a voice first');
      return;
    }

    const paragraphs = story.paragraphs || [];

    // 筛选出没有音频的段落（排除已有音频和正在处理的）
    const paragraphsToGenerate = paragraphs.filter((p) => {
      const audioState = paragraphAudio[p.id];
      // 跳过：已有数据库音频、本次会话已生成、正在处理中
      if (p.audioUrl && p.audioStatus === 'completed') return false;
      if (audioState?.status === 'SUCCESS') return false;
      if (audioState?.status === 'PROCESSING') return false;
      return true;
    });

    if (paragraphsToGenerate.length === 0) {
      // 没有需要生成的段落
      onClose();
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 为每个段落创建 TTS 任务
      for (const paragraph of paragraphsToGenerate) {
        const result = await createTtsTask({
          text: paragraph.content,
          voice_name: selectedVoice.name,
          language: selectedVoice.locale,
          style: selectedStyle || undefined,
          story_id: story.id,
        });

        if (result.status === 'FAILURE' && result.errorCode) {
          // 遇到错误（如积分不足），停止继续生成
          setError(result.error || 'Failed to generate audio');
          setIsGenerating(false);
          return;
        }

        // 任务提交成功，设置初始状态并开始轮询
        if (result.task_id) {
          setParagraphAudio((prev) => ({
            ...prev,
            [paragraph.id]: {
              taskId: result.task_id!,
              status: 'PROCESSING',
            },
          }));

          // 开始轮询（不等待完成，继续下一个）
          pollTaskStatus(result.task_id, paragraph.id, selectedVoice.name);
        }
      }

      // 所有任务已提交
      setIsGenerating(false);
    } catch (err) {
      console.error('Failed to generate audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setIsGenerating(false);
    }
  };

  // 生成单个段落的语音
  const handleGenerateParagraph = async (paragraph: StoryParagraph) => {
    if (!selectedVoice) {
      setError(t('story.audio.selectVoiceFirst') || 'Please select a voice first');
      return;
    }

    setGeneratingParagraphId(paragraph.id);
    setError(null);

    try {
      const result = await createTtsTask({
        text: paragraph.content,
        voice_name: selectedVoice.name,
        language: selectedVoice.locale,
        style: selectedStyle || undefined,
        story_id: story.id,
      });

      if (result.status === 'FAILURE' && result.errorCode) {
        setError(result.error || 'Failed to generate audio');
        setGeneratingParagraphId(null);
        return;
      }

      // 任务提交成功，设置初始状态并开始轮询
      if (result.task_id) {
        setParagraphAudio((prev) => ({
          ...prev,
          [paragraph.id]: {
            taskId: result.task_id!,
            status: 'PROCESSING',
          },
        }));
        setGeneratingParagraphId(null);

        // 开始轮询
        pollTaskStatus(result.task_id, paragraph.id, selectedVoice.name);
      } else {
        setGeneratingParagraphId(null);
      }
    } catch (err) {
      console.error('Failed to generate paragraph audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setGeneratingParagraphId(null);
    }
  };

  // 切换段落展开状态
  const toggleParagraphExpanded = (paragraphId: string) => {
    setExpandedParagraphs((prev) => {
      const next = new Set(prev);
      if (next.has(paragraphId)) {
        next.delete(paragraphId);
      } else {
        next.add(paragraphId);
      }
      return next;
    });
  };

  // 播放/暂停音频
  const handlePlayAudio = (paragraphId: string, audioUrl: string) => {
    if (playingParagraphId === paragraphId && audioRef.current) {
      // 暂停当前播放
      audioRef.current.pause();
      setPlayingParagraphId(null);
    } else {
      // 停止之前的音频
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 播放新的音频
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlayingParagraphId(null);
      audioRef.current.play();
      setPlayingParagraphId(paragraphId);
    }
  };

  const paragraphs = story.paragraphs || [];

  return (
    <>
      {/* Mobile: fullscreen, Desktop: centered modal */}
      <div className="fixed inset-0 z-50 lg:flex lg:items-center lg:justify-center lg:p-4">
        <div className="hidden lg:block absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white h-full lg:h-auto lg:rounded-2xl shadow-xl lg:max-w-2xl w-full lg:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('story.audio.title') || 'Generate Audio'}
              </h3>
              <p className="text-sm text-gray-500 truncate">{story.title}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-4 disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Voice Selector */}
          <div className="p-4 border-b border-gray-100 shrink-0">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t('story.audio.selectVoice') || 'Select Voice'}
            </p>
            <VoiceSelectButton
              voice={selectedVoice}
              selectedStyle={selectedStyle}
              onClick={() => setIsVoiceSelectorOpen(true)}
              disabled={isGenerating}
              size="medium"
            />
          </div>

          {/* Paragraphs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {paragraphs.length === 0 ? (
              // 没有段落时显示完整内容
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {story.content}
                </p>
              </div>
            ) : (
              paragraphs.map((paragraph, index) => {
                const audioState = paragraphAudio[paragraph.id];
                const isExpanded = expandedParagraphs.has(paragraph.id);
                const isPlaying = playingParagraphId === paragraph.id;

                return (
                  <div
                    key={paragraph.id}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* 段落编号 */}
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-purple-700 bg-purple-100 rounded-full flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>

                      {/* 段落内容 */}
                      <div className="flex-1 min-w-0">
                        {/* 可折叠的文字内容 */}
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleParagraphExpanded(paragraph.id)}
                        >
                          <p
                            className={`text-gray-700 text-sm leading-relaxed ${
                              isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1'
                            }`}
                          >
                            {paragraph.content}
                          </p>
                          {/* 展开/收起指示器 */}
                          {paragraph.content.length > 50 && (
                            <button
                              className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 mt-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  {t('common.collapse') || 'Collapse'}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  {t('common.expand') || 'Expand'}
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* 段落音频状态/操作 */}
                        <div className="flex items-center gap-2 mt-2">
                          {/* 优先检查本次会话生成的音频 */}
                          {audioState?.status === 'SUCCESS' && audioState.audioUrl ? (
                            <button
                              onClick={() => handlePlayAudio(paragraph.id, audioState.audioUrl!)}
                              className="inline-flex items-center gap-1.5 text-xs text-white bg-purple-500 hover:bg-purple-600 px-3 py-1.5 rounded-full transition-colors"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  {t('common.pause') || 'Pause'}
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  {t('common.play') || 'Play'}
                                </>
                              )}
                            </button>
                          ) : audioState?.status === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t('common.processing') || 'Processing...'}
                            </span>
                          ) : audioState?.status === 'FAILURE' ? (
                            <button
                              onClick={() => handleGenerateParagraph(paragraph)}
                              disabled={!selectedVoice || generatingParagraphId !== null}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {t('common.retry') || 'Retry'}
                            </button>
                          ) : paragraph.audioUrl && paragraph.audioStatus === 'completed' ? (
                            /* 已有的段落音频（来自数据库） - 显示播放按钮 */
                            <button
                              onClick={() => handlePlayAudio(paragraph.id, paragraph.audioUrl!)}
                              className="inline-flex items-center gap-1.5 text-xs text-white bg-purple-500 hover:bg-purple-600 px-3 py-1.5 rounded-full transition-colors"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  {t('common.pause') || 'Pause'}
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  {t('common.play') || 'Play'}
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateParagraph(paragraph)}
                              disabled={!selectedVoice || generatingParagraphId !== null}
                              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingParagraphId === paragraph.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  {t('common.generating') || 'Generating...'}
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  {t('story.audio.generateThis') || 'Generate this'}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={!selectedVoice || isGenerating}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.generating') || 'Generating...'}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  {t('story.audio.generateAll') || 'Generate All'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Selector Bottom Sheet */}
      {isVoiceSelectorOpen && (
        <VoiceSelectorBottomSheet
          isOpen={isVoiceSelectorOpen}
          onClose={() => setIsVoiceSelectorOpen(false)}
          selectedVoice={selectedVoice}
          onSelect={handleVoiceSelect}
          height="70%"
        />
      )}
    </>
  );
}