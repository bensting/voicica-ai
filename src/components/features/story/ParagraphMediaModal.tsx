'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Volume2,
  Play,
  Pause,
  Loader2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createTtsTask, getTtsTaskStatus, updateParagraphAudio } from '@/actions/tts';
import { generateParagraphIllustration } from '@/actions/illustration';
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

// 段落插图状态类型
interface ParagraphIllustrationState {
  status: 'none' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  prompt?: string;
}

interface ParagraphMediaModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

export default function ParagraphMediaModal({
  story,
  isOpen,
  onClose,
  onSuccess,
  t,
}: ParagraphMediaModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingParagraphId, setGeneratingParagraphId] = useState<string | null>(null);

  // 段落音频状态追踪
  const [paragraphAudio, setParagraphAudio] = useState<Record<string, ParagraphAudioState>>({});
  // 段落插图状态追踪
  const [paragraphIllustration, setParagraphIllustration] = useState<
    Record<string, ParagraphIllustrationState>
  >({});
  // 展开的段落
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set());
  // 当前播放的音频
  const [playingParagraphId, setPlayingParagraphId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 下载全部状态
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  // 正在生成插图的段落
  const [generatingIllustrationId, setGeneratingIllustrationId] = useState<string | null>(null);
  // 批量生成所有插图状态
  const [isGeneratingAllIllustrations, setIsGeneratingAllIllustrations] = useState(false);
  // 预览插图
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
      setParagraphIllustration({});
      setExpandedParagraphs(new Set());
      setPlayingParagraphId(null);
      setPreviewImageUrl(null);
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
    localStorage.setItem('lastSelectedVoice', JSON.stringify(voice));
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, paragraphId: string, voiceName: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const result = await getTtsTaskStatus(taskId);

        if (result.status === 'SUCCESS' && result.result) {
          const audioUrl = result.result.audio_url;
          const audioDuration = result.result.duration;

          setParagraphAudio((prev) => ({
            ...prev,
            [paragraphId]: {
              taskId,
              status: 'SUCCESS',
              audioUrl,
            },
          }));

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

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
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
  const handleGenerateAllAudio = async () => {
    if (!selectedVoice) {
      setError(t('story.audio.selectVoiceFirst') || 'Please select a voice first');
      return;
    }

    const paragraphs = story.paragraphs || [];

    const paragraphsToGenerate = paragraphs.filter((p) => {
      const audioState = paragraphAudio[p.id];
      if (p.audioUrl && p.audioStatus === 'completed') return false;
      if (audioState?.status === 'SUCCESS') return false;
      if (audioState?.status === 'PROCESSING') return false;
      return true;
    });

    if (paragraphsToGenerate.length === 0) {
      return;
    }

    setIsGeneratingAudio(true);
    setError(null);

    try {
      for (const paragraph of paragraphsToGenerate) {
        const result = await createTtsTask({
          text: paragraph.content,
          voice_name: selectedVoice.name,
          language: selectedVoice.locale,
          style: selectedStyle || undefined,
          story_id: story.id,
        });

        if (result.status === 'FAILURE' && result.errorCode) {
          setError(result.error || 'Failed to generate audio');
          setIsGeneratingAudio(false);
          return;
        }

        if (result.task_id) {
          setParagraphAudio((prev) => ({
            ...prev,
            [paragraph.id]: {
              taskId: result.task_id!,
              status: 'PROCESSING',
            },
          }));

          pollTaskStatus(result.task_id, paragraph.id, selectedVoice.name);
        }
      }

      setIsGeneratingAudio(false);
    } catch (err) {
      console.error('Failed to generate audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setIsGeneratingAudio(false);
    }
  };

  // 生成单个段落的语音
  const handleGenerateParagraphAudio = async (paragraph: StoryParagraph) => {
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

      if (result.task_id) {
        setParagraphAudio((prev) => ({
          ...prev,
          [paragraph.id]: {
            taskId: result.task_id!,
            status: 'PROCESSING',
          },
        }));
        setGeneratingParagraphId(null);
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

  // 生成段落插图
  const handleGenerateParagraphIllustration = async (paragraph: StoryParagraph) => {
    setGeneratingIllustrationId(paragraph.id);
    setError(null);

    // 设置为处理中
    setParagraphIllustration((prev) => ({
      ...prev,
      [paragraph.id]: {
        status: 'processing',
      },
    }));

    try {
      const result = await generateParagraphIllustration(paragraph.id);

      if (result.success && result.imageUrl) {
        setParagraphIllustration((prev) => ({
          ...prev,
          [paragraph.id]: {
            status: 'completed',
            imageUrl: result.imageUrl,
            prompt: result.prompt,
          },
        }));
        onSuccess(); // 刷新数据
      } else {
        setParagraphIllustration((prev) => ({
          ...prev,
          [paragraph.id]: {
            status: 'failed',
          },
        }));

        if (result.errorCode === 'INSUFFICIENT_CREDITS' && result.errorData) {
          setError(
            t('story.illustration.insufficientCredits')?.replace(
              '{required}',
              String(result.errorData.required)
            ) || `Insufficient credits. Need ${result.errorData.required} credits.`
          );
        } else {
          setError(result.error || 'Failed to generate illustration');
        }
      }
    } catch (err) {
      console.error('Failed to generate illustration:', err);
      setParagraphIllustration((prev) => ({
        ...prev,
        [paragraph.id]: {
          status: 'failed',
        },
      }));
      setError(err instanceof Error ? err.message : 'Failed to generate illustration');
    } finally {
      setGeneratingIllustrationId(null);
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
      audioRef.current.pause();
      setPlayingParagraphId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlayingParagraphId(null);
      audioRef.current.play();
      setPlayingParagraphId(paragraphId);
    }
  };

  // 下载音频
  const handleDownloadAudio = async (audioUrl: string, index: number) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title}-${index + 1}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download audio:', err);
    }
  };

  // 下载全部音频
  const handleDownloadAllAudio = async () => {
    const allParagraphs = story.paragraphs || [];

    const audioItems: { url: string; index: number }[] = [];
    allParagraphs.forEach((p, index) => {
      const audioState = paragraphAudio[p.id];
      if (audioState?.status === 'SUCCESS' && audioState.audioUrl) {
        audioItems.push({ url: audioState.audioUrl, index });
      } else if (p.audioUrl && p.audioStatus === 'completed') {
        audioItems.push({ url: p.audioUrl, index });
      }
    });

    if (audioItems.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();

      for (const item of audioItems) {
        const response = await fetch(item.url);
        const blob = await response.blob();
        zip.file(`${item.index + 1}.mp3`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${story.title}-audio.zip`);
    } catch (err) {
      console.error('Failed to download all audio:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // 批量生成所有未生成插图的段落
  const handleGenerateAllIllustrations = async () => {
    const allParagraphs = story.paragraphs || [];

    // 筛选出没有插图的段落
    const paragraphsToGenerate = allParagraphs.filter((p) => {
      const localState = paragraphIllustration[p.id];
      if (localState?.status === 'completed' && localState.imageUrl) return false;
      if (localState?.status === 'processing') return false;
      if (p.illustrationUrl && p.illustrationStatus === 'completed') return false;
      return true;
    });

    if (paragraphsToGenerate.length === 0) {
      return;
    }

    setIsGeneratingAllIllustrations(true);
    setError(null);

    try {
      for (const paragraph of paragraphsToGenerate) {
        // 设置为处理中
        setParagraphIllustration((prev) => ({
          ...prev,
          [paragraph.id]: {
            status: 'processing',
          },
        }));

        const result = await generateParagraphIllustration(paragraph.id);

        if (result.success && result.imageUrl) {
          setParagraphIllustration((prev) => ({
            ...prev,
            [paragraph.id]: {
              status: 'completed',
              imageUrl: result.imageUrl,
              prompt: result.prompt,
            },
          }));
        } else {
          setParagraphIllustration((prev) => ({
            ...prev,
            [paragraph.id]: {
              status: 'failed',
            },
          }));

          if (result.errorCode === 'INSUFFICIENT_CREDITS' && result.errorData) {
            setError(
              t('story.illustration.insufficientCredits')?.replace(
                '{required}',
                String(result.errorData.required)
              ) || `Insufficient credits. Need ${result.errorData.required} credits.`
            );
            setIsGeneratingAllIllustrations(false);
            return;
          }
        }
      }

      onSuccess(); // 刷新数据
    } catch (err) {
      console.error('Failed to generate all illustrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate illustrations');
    } finally {
      setIsGeneratingAllIllustrations(false);
    }
  };

  // 获取段落的插图 URL（优先本地状态，其次数据库）
  const getParagraphIllustrationUrl = (paragraph: StoryParagraph) => {
    const localState = paragraphIllustration[paragraph.id];
    if (localState?.status === 'completed' && localState.imageUrl) {
      return localState.imageUrl;
    }
    if (paragraph.illustrationUrl && paragraph.illustrationStatus === 'completed') {
      return paragraph.illustrationUrl;
    }
    return null;
  };

  // 获取段落的插图状态
  const getParagraphIllustrationStatus = (paragraph: StoryParagraph) => {
    const localState = paragraphIllustration[paragraph.id];
    if (localState) {
      return localState.status;
    }
    return paragraph.illustrationStatus || 'none';
  };

  const paragraphs = story.paragraphs || [];

  // 计算有音频的段落数量
  const audioCount = paragraphs.filter((p) => {
    const audioState = paragraphAudio[p.id];
    return (
      (audioState?.status === 'SUCCESS' && audioState.audioUrl) ||
      (p.audioUrl && p.audioStatus === 'completed')
    );
  }).length;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 z-50 lg:flex lg:items-center lg:justify-center lg:p-4">
        <div
          className="hidden lg:block absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-white h-full lg:h-auto lg:rounded-2xl shadow-xl lg:max-w-2xl w-full lg:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('story.media.title') || 'Audio & Illustrations'}
              </h3>
              <p className="text-sm text-gray-500 truncate">{story.title}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isGeneratingAudio}
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
              disabled={isGeneratingAudio}
              size="medium"
            />
          </div>

          {/* Paragraphs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {paragraphs.length === 0 ? (
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
                const illustrationUrl = getParagraphIllustrationUrl(paragraph);
                const illustrationStatus = getParagraphIllustrationStatus(paragraph);

                return (
                  <div key={paragraph.id} className="bg-gray-50 rounded-xl p-4">
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
                              isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                            }`}
                          >
                            {paragraph.content}
                          </p>
                          {paragraph.content.length > 80 && (
                            <button className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 mt-1">
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

                        {/* 媒体区域 */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* 音频控制 */}
                          {audioState?.status === 'SUCCESS' && audioState.audioUrl ? (
                            <>
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
                              <button
                                onClick={() => handleDownloadAudio(audioState.audioUrl!, index)}
                                className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                title={t('common.download') || 'Download'}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : audioState?.status === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t('common.processing') || 'Processing...'}
                            </span>
                          ) : audioState?.status === 'FAILURE' ? (
                            <button
                              onClick={() => handleGenerateParagraphAudio(paragraph)}
                              disabled={!selectedVoice || generatingParagraphId !== null}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {t('common.retry') || 'Retry'}
                            </button>
                          ) : paragraph.audioUrl && paragraph.audioStatus === 'completed' ? (
                            <>
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
                              <button
                                onClick={() => handleDownloadAudio(paragraph.audioUrl!, index)}
                                className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                title={t('common.download') || 'Download'}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleGenerateParagraphAudio(paragraph)}
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
                                  {t('story.audio.generateThis') || 'Audio'}
                                </>
                              )}
                            </button>
                          )}

                          {/* 分隔符 */}
                          <span className="text-gray-300">|</span>

                          {/* 插图控制 */}
                          {illustrationStatus === 'completed' && illustrationUrl ? (
                            <>
                              <button
                                onClick={() => setPreviewImageUrl(illustrationUrl)}
                                className="inline-flex items-center gap-1.5 text-xs text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-full transition-colors"
                              >
                                <ImageIcon className="w-3 h-3" />
                                {t('common.view') || 'View'}
                              </button>
                              <button
                                onClick={() => handleGenerateParagraphIllustration(paragraph)}
                                disabled={generatingIllustrationId !== null}
                                className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                                title={t('story.illustration.regenerate') || 'Regenerate'}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : illustrationStatus === 'processing' ||
                            generatingIllustrationId === paragraph.id ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t('common.processing') || 'Processing...'}
                            </span>
                          ) : illustrationStatus === 'failed' ? (
                            <button
                              onClick={() => handleGenerateParagraphIllustration(paragraph)}
                              disabled={generatingIllustrationId !== null}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {t('common.retry') || 'Retry'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateParagraphIllustration(paragraph)}
                              disabled={generatingIllustrationId !== null}
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ImageIcon className="w-3 h-3" />
                              {t('story.illustration.generate') || 'Illustration'}
                            </button>
                          )}
                        </div>

                        {/* 插图缩略图 */}
                        {illustrationUrl && (
                          <div className="mt-3">
                            <button
                              onClick={() => setPreviewImageUrl(illustrationUrl)}
                              className="block w-full max-w-[200px] aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors"
                            >
                              <Image
                                src={illustrationUrl}
                                alt={`Illustration for paragraph ${index + 1}`}
                                width={200}
                                height={150}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          </div>
                        )}
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
          <div className="p-4 border-t border-gray-100 shrink-0 space-y-3">
            {audioCount > 0 && (
              <button
                onClick={handleDownloadAllAudio}
                disabled={isDownloadingAll}
                className="w-full px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('story.audio.downloading') || 'Downloading...'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t('story.audio.downloadAll') || 'Download All Audio'} ({audioCount})
                  </>
                )}
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleGenerateAllAudio}
                disabled={!selectedVoice || isGeneratingAudio || isGeneratingAllIllustrations}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.generating') || 'Generating...'}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    {t('story.audio.generateAllAudio') || 'Generate All Audio'}
                  </>
                )}
              </button>
              <button
                onClick={handleGenerateAllIllustrations}
                disabled={isGeneratingAudio || isGeneratingAllIllustrations}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingAllIllustrations ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.generating') || 'Generating...'}
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    {t('story.illustration.generateAllIllustrations') || 'Generate All Illustrations'}
                  </>
                )}
              </button>
            </div>
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

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={previewImageUrl}
              alt="Illustration preview"
              width={1024}
              height={768}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}