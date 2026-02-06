'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getMusicRecords, deleteMusicRecord, type MusicRecord } from '@/actions/music';
import { getTtsRecords, deleteTtsRecord, type TtsRecord } from '@/actions/tts';
import { getCoverRecords, deleteCoverRecord, type CoverRecord } from '@/actions/cover';
import { getDialogueRecords, deleteDialogueRecord, type DialogueRecord } from '@/actions/dialogue';
import { getImageRecords, deleteImageRecord, type ImageRecord } from '@/actions/image';
import { getVideoRecordByTaskId, deleteVideoRecord, type VideoRecord } from '@/actions/video';
import { useMusicTaskPolling } from '@/hooks/useMusicTaskPolling';
import { useVideoTaskPolling } from '@/hooks/useVideoTaskPolling';
import { useImageTaskPolling } from '@/hooks/useImageTaskPolling';
import { useDialogueTaskPolling } from '@/hooks/useDialogueTaskPolling';
import {
  getAvailableMyCreationsTabs,
  getDefaultMyCreationsTab,
  isValidMyCreationsTab,
  type MyCreationsTabId,
} from '@/config/native/myCreationsTabsConfig';
import { useLanguage } from '@/contexts/LanguageContext';

// 提取的组件
import MusicDetailModal from './MusicDetailModal';
import CoverDetailModal from './CoverDetailModal';
import VoiceDetailModal from './VoiceDetailModal';
import DialogueDetailModal from './DialogueDetailModal';
import ImageDetailModal from './ImageDetailModal';
import VideoDetailModal from './VideoDetailModal';
import { MusicCard, CoverCard, VoiceCard, DialogueCard, VideoCard, ImageCard } from './cards';
import { formatDateLong } from './utils';

interface VideoItem {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}


// 空状态插画
const EmptyIllustration = () => (
  <svg
    className="w-16 h-16 text-gray-600"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {/* 文件夹 */}
    <rect x="25" y="40" width="50" height="45" rx="4" />
    <path d="M25 50 L25 45 Q25 40 30 40 L45 40 L50 35 L70 35 Q75 35 75 40 L75 50" />
    {/* 加号 */}
    <line x1="50" y1="55" x2="50" y2="75" strokeWidth="3" />
    <line x1="40" y1="65" x2="60" y2="65" strokeWidth="3" />
    {/* 人物 */}
    <circle cx="90" cy="55" r="8" />
    <path d="M82 75 Q82 65 90 65 Q98 65 98 75" />
    <path d="M85 72 L80 85" />
    <path d="M95 68 L105 60" />
  </svg>
);

/**
 * My Creations 区域
 * 显示用户创建的内容，支持 Tab 切换和下拉刷新
 */
export default function MyCreations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useFirebaseAuth();
  const { t } = useLanguage();

  // 获取可用的标签配置
  const availableTabs = useMemo(() => getAvailableMyCreationsTabs(), []);
  const defaultTab = useMemo(() => getDefaultMyCreationsTab(), []);

  // 从 URL 参数获取初始 tab
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && isValidMyCreationsTab(tabFromUrl)
    ? tabFromUrl
    : defaultTab;

  const [activeTab, setActiveTab] = useState<MyCreationsTabId>(initialTab);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [imageRecords, setImageRecords] = useState<ImageRecord[]>([]);
  const [musicRecords, setMusicRecords] = useState<MusicRecord[]>([]);
  const [voiceRecords, setVoiceRecords] = useState<TtsRecord[]>([]);
  const [coverRecords, setCoverRecords] = useState<CoverRecord[]>([]);
  const [dialogueRecords, setDialogueRecords] = useState<DialogueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicRecord | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverRecord | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TtsRecord | null>(null);
  const [selectedDialogue, setSelectedDialogue] = useState<DialogueRecord | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);

  // 下拉刷新相关
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const PULL_THRESHOLD = 60;

  // 获取视频列表
  const fetchVideos = useCallback(async (isRefresh = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/v1/native/video/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // 获取音乐列表
  const fetchMusic = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getMusicRecords(50);
      setMusicRecords(records);
    } catch (error) {
      console.error('Failed to fetch music records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取语音列表
  const fetchVoices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getTtsRecords(50);
      setVoiceRecords(records);
    } catch (error) {
      console.error('Failed to fetch voice records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取 Cover 列表
  const fetchCovers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getCoverRecords(50);
      setCoverRecords(records);
    } catch (error) {
      console.error('Failed to fetch cover records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取 Dialogue 列表
  const fetchDialogues = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getDialogueRecords(50);
      setDialogueRecords(records);
    } catch (error) {
      console.error('Failed to fetch dialogue records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取 Image 列表
  const fetchImages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getImageRecords(50);
      setImageRecords(records);
    } catch (error) {
      console.error('Failed to fetch image records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 同步 URL 参数到 activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && isValidMyCreationsTab(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'video') {
      fetchVideos();
    } else if (activeTab === 'image') {
      fetchImages();
    } else if (activeTab === 'music') {
      fetchMusic();
    } else if (activeTab === 'voices') {
      fetchVoices();
    } else if (activeTab === 'cover') {
      fetchCovers();
    } else if (activeTab === 'dialogues') {
      fetchDialogues();
    }
  }, [activeTab, fetchVideos, fetchImages, fetchMusic, fetchVoices, fetchCovers, fetchDialogues]);

  // 使用 hook 轮询处理中的音乐任务状态
  useMusicTaskPolling({
    records: musicRecords,
    enabled: activeTab === 'music',
    onStatusUpdate: useCallback((taskId, status) => {
      setMusicRecords((prev) =>
        prev.map((record) => {
          if (record.task_id === taskId) {
            return {
              ...record,
              status: status.status,
              progress: status.progress,
              audio_url: status.result?.audio_url || record.audio_url,
              audio_url_2: status.result?.audio_url_2 || record.audio_url_2,
              cover_url: status.result?.cover_url || record.cover_url,
              cover_url_2: status.result?.cover_url_2 || record.cover_url_2,
              duration: status.result?.duration || record.duration,
              duration_2: status.result?.duration_2 || record.duration_2,
              title: status.result?.title || record.title,
              tags: status.result?.tags || record.tags,
              lyrics: status.result?.lyrics || record.lyrics,
            };
          }
          return record;
        })
      );
    }, []),
  });

  // 使用 hook 轮询处理中的视频任务状态
  useVideoTaskPolling({
    videos,
    enabled: activeTab === 'video',
    onStatusUpdate: useCallback((taskId, status) => {
      setVideos((prev) =>
        prev.map((video) => {
          if (video.taskId === taskId) {
            return {
              ...video,
              status: status.status,
              progress: status.progress,
              videoUrl: status.video_url || video.videoUrl,
              errorMessage: status.error_message || video.errorMessage,
            };
          }
          return video;
        })
      );
    }, []),
  });

  // 使用 hook 轮询处理中的图片任务状态
  useImageTaskPolling({
    records: imageRecords,
    enabled: activeTab === 'image',
    onStatusUpdate: useCallback((taskId, status) => {
      setImageRecords((prev) =>
        prev.map((record) => {
          if (record.task_id === taskId) {
            return {
              ...record,
              status: status.status,
              image_url: status.imageUrl || record.image_url,
              error: status.error || record.error,
            };
          }
          return record;
        })
      );
    }, []),
  });

  // 使用 hook 轮询处理中的 Dialogue 任务状态
  useDialogueTaskPolling({
    records: dialogueRecords,
    enabled: activeTab === 'dialogues',
    onStatusUpdate: useCallback((taskId, status) => {
      setDialogueRecords((prev) => {
        const updatedRecords = prev.map((record) => {
          if (record.task_id === taskId) {
            const updatedRecord = {
              ...record,
              status: status.status,
              progress: status.progress,
              audio_url: status.audioUrl || record.audio_url,
            };
            // 如果任务刚完成，弹出详情弹窗
            if (status.status === 'SUCCESS' && record.status !== 'SUCCESS') {
              setTimeout(() => setSelectedDialogue(updatedRecord), 0);
            }
            return updatedRecord;
          }
          return record;
        });
        return updatedRecords;
      });
    }, []),
  });

  // 下拉刷新触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || scrollRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      if (activeTab === 'video') {
        await fetchVideos(true);
      } else if (activeTab === 'image') {
        await fetchImages(true);
      } else if (activeTab === 'music') {
        await fetchMusic(true);
      } else if (activeTab === 'voices') {
        await fetchVoices(true);
      } else if (activeTab === 'cover') {
        await fetchCovers(true);
      } else if (activeTab === 'dialogues') {
        await fetchDialogues(true);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleVideoClick = async (video: VideoItem) => {
    // Only completed videos can open detail modal
    if (video.status === 'SUCCESS') {
      const fullRecord = await getVideoRecordByTaskId(video.taskId);
      if (fullRecord) {
        setSelectedVideo(fullRecord);
      }
    }
  };

  const handleVideoRecreate = (video: VideoRecord) => {
    // Navigate to create page with prompt
    const params = new URLSearchParams();
    if (video.prompt) params.set('prompt', video.prompt);
    router.push(`/native/create/video?${params.toString()}`);
    setSelectedVideo(null);
  };

  const handleVideoDelete = async (video: VideoRecord) => {
    await deleteVideoRecord(String(video.id));
    setVideos((prev) => prev.filter((v) => v.taskId !== video.task_id));
    setSelectedVideo(null);
  };

  const handleMusicClick = (music: MusicRecord) => {
    // 只有完成的音乐才能打开详情
    if (music.status === 'SUCCESS') {
      setSelectedMusic(music);
    }
  };

  const handleMusicRecreate = (music: MusicRecord) => {
    // 跳转到创建页面，带上 prompt 参数
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.style) params.set('style', music.style);
    if (music.model) params.set('model', music.model);
    router.push(`/native/create/music?${params.toString()}`);
    setSelectedMusic(null);
  };

  const handleMusicDelete = async (music: MusicRecord) => {
    await deleteMusicRecord(music.id);
    setMusicRecords((prev) => prev.filter((m) => m.id !== music.id));
  };

  const handleCoverClick = (cover: CoverRecord) => {
    // 只有完成的 cover 才能打开详情
    if (cover.status === 'SUCCESS') {
      setSelectedCover(cover);
    }
  };

  const handleCoverRecreate = () => {
    // 跳转到创建页面
    router.push('/native/create/cover');
    setSelectedCover(null);
  };

  const handleCoverDelete = async (cover: CoverRecord) => {
    await deleteCoverRecord(cover.id);
    setCoverRecords((prev) => prev.filter((c) => c.id !== cover.id));
  };

  const handleVoiceClick = (voice: TtsRecord) => {
    // 只有完成的 voice 才能打开详情
    if (voice.status === 'SUCCESS') {
      setSelectedVoice(voice);
    }
  };

  const handleVoiceRecreate = () => {
    // 跳转到创建页面
    router.push('/native/create/voice');
    setSelectedVoice(null);
  };

  const handleVoiceDelete = async (voice: TtsRecord) => {
    await deleteTtsRecord(String(voice.id));
    setVoiceRecords((prev) => prev.filter((v) => v.id !== voice.id));
  };

  const handleDialogueClick = (dialogue: DialogueRecord) => {
    // 只有完成的 dialogue 才能打开详情
    if (dialogue.status === 'SUCCESS') {
      setSelectedDialogue(dialogue);
    }
  };

  const handleDialogueRecreate = () => {
    // 跳转到创建页面
    router.push('/native/create/dialogue');
    setSelectedDialogue(null);
  };

  const handleDialogueDelete = async (dialogue: DialogueRecord) => {
    await deleteDialogueRecord(dialogue.id);
    setDialogueRecords((prev) => prev.filter((d) => d.id !== dialogue.id));
  };

  const handleImageClick = (image: ImageRecord) => {
    // 只有完成的 image 才能打开详情
    if (image.status === 'SUCCESS') {
      setSelectedImage(image);
    }
  };

  const handleImageRecreate = (image: ImageRecord) => {
    // 跳转到创建页面，带上 prompt 参数
    const params = new URLSearchParams();
    if (image.prompt) params.set('prompt', image.prompt);
    router.push(`/native/create/image?${params.toString()}`);
    setSelectedImage(null);
  };

  const handleImageDelete = async (image: ImageRecord) => {
    await deleteImageRecord(image.id);
    setImageRecords((prev) => prev.filter((i) => i.id !== image.id));
  };

  // 过滤掉失败的记录
  const filteredVideoRecords = videos.filter((v) => v.status !== 'FAILURE');
  const filteredImageRecords = imageRecords.filter((i) => i.status !== 'FAILURE');
  const filteredMusicRecords = musicRecords.filter((m) => m.status !== 'FAILURE');
  const filteredVoiceRecords = voiceRecords.filter((v) => v.status !== 'FAILURE');
  const filteredCoverRecords = coverRecords.filter((c) => c.status !== 'FAILURE');
  const filteredDialogueRecords = dialogueRecords.filter((d) => d.status !== 'FAILURE');

  // 获取当前 tab 的空状态配置（使用翻译）
  const currentTabConfig = availableTabs.find((tab) => tab.id === activeTab);
  const emptyStateSubtitleKey: Record<MyCreationsTabId, string> = {
    voices: 'native.me.emptyState.createFirstVoice',
    dialogues: 'native.me.emptyState.createFirstDialogue',
    music: 'native.me.emptyState.createFirstMusic',
    cover: 'native.me.emptyState.createFirstCover',
    video: 'native.me.emptyState.createFirstVideo',
    image: 'native.me.emptyState.createFirstImage',
  };
  const emptyState = {
    title: t('native.me.emptyState.noContent'),
    subtitle: t(emptyStateSubtitleKey[activeTab] || 'native.me.emptyState.createFirstVoice'),
    createLink: currentTabConfig?.emptyState.createLink || '/native',
  };

  // Tab 标签翻译
  const tabLabelKey: Record<MyCreationsTabId, string> = {
    voices: 'native.me.tabs.voices',
    dialogues: 'native.me.tabs.dialogues',
    music: 'native.me.tabs.music',
    cover: 'native.me.tabs.cover',
    video: 'native.me.tabs.video',
    image: 'native.me.tabs.image',
  };
  const isEmpty = activeTab === 'video'
    ? filteredVideoRecords.length === 0
    : activeTab === 'image'
    ? filteredImageRecords.length === 0
    : activeTab === 'music'
    ? filteredMusicRecords.length === 0
    : activeTab === 'voices'
    ? filteredVoiceRecords.length === 0
    : activeTab === 'cover'
    ? filteredCoverRecords.length === 0
    : activeTab === 'dialogues'
    ? filteredDialogueRecords.length === 0
    : true;

  // 按日期分组
  const groupedVideoRecords = filteredVideoRecords.reduce((groups, video) => {
    const date = formatDateLong(video.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(video);
    return groups;
  }, {} as Record<string, VideoItem[]>);

  const groupedImageRecords = filteredImageRecords.reduce((groups, image) => {
    const date = formatDateLong(image.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(image);
    return groups;
  }, {} as Record<string, ImageRecord[]>);

  const groupedMusicRecords = filteredMusicRecords.reduce((groups, music) => {
    const date = formatDateLong(music.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(music);
    return groups;
  }, {} as Record<string, MusicRecord[]>);

  const groupedVoiceRecords = filteredVoiceRecords.reduce((groups, voice) => {
    const date = formatDateLong(voice.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(voice);
    return groups;
  }, {} as Record<string, TtsRecord[]>);

  const groupedCoverRecords = filteredCoverRecords.reduce((groups, cover) => {
    const date = formatDateLong(cover.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(cover);
    return groups;
  }, {} as Record<string, CoverRecord[]>);

  const groupedDialogueRecords = filteredDialogueRecords.reduce((groups, dialogue) => {
    const date = formatDateLong(dialogue.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(dialogue);
    return groups;
  }, {} as Record<string, DialogueRecord[]>);

  return (
    <div className="h-full flex flex-col">
      {/* 固定的标题和 Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 bg-[#0a0a1a]">
        {/* 标题 */}
        <h2 className="text-xl font-bold text-white mb-3">{t('native.me.myCreations')}</h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t(tabLabelKey[tab.id])}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: pullDistance > 0 ? pullDistance : 16 }}
      >
        {/* 下拉刷新指示器 */}
        {(pullDistance > 0 || refreshing) && (
          <div className="flex justify-center py-2 -mt-2 mb-2">
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`text-gray-400 text-xs transition-opacity ${pullDistance >= PULL_THRESHOLD ? 'opacity-100' : 'opacity-50'}`}>
                {pullDistance >= PULL_THRESHOLD ? t('native.me.releaseToRefresh') : t('native.me.pullToRefresh')}
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        {activeTab === 'video' ? (
          loading && videos.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // 视频列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedVideoRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((video) => (
                      <VideoCard
                        key={video.taskId}
                        video={video}
                        onClick={() => handleVideoClick(video)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'image' ? (
          loading && imageRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // 图片列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedImageRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((image) => (
                      <ImageCard
                        key={image.task_id}
                        image={image}
                        onClick={() => handleImageClick(image)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'music' ? (
          loading && musicRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // 音乐列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedMusicRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((music) => (
                      <MusicCard
                        key={music.task_id}
                        music={music}
                        onClick={() => handleMusicClick(music)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'voices' ? (
          loading && voiceRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // 语音列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedVoiceRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((voice) => (
                      <VoiceCard
                        key={voice.task_id}
                        voice={voice}
                        onClick={() => handleVoiceClick(voice)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'cover' ? (
          loading && coverRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // Cover 列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedCoverRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((cover) => (
                      <CoverCard
                        key={cover.task_id}
                        cover={cover}
                        onClick={() => handleCoverClick(cover)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'dialogues' ? (
          loading && dialogueRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('native.me.goCreate')}
              </Link>
            </div>
          ) : (
            // Dialogue 列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedDialogueRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((dialogue) => (
                      <DialogueCard
                        key={dialogue.task_id}
                        dialogue={dialogue}
                        onClick={() => handleDialogueClick(dialogue)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : isEmpty ? (
          // 其他 tab 的空状态
          <div className="flex flex-col items-center justify-center py-8">
            <EmptyIllustration />
            <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
            <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
            <Link
              href={emptyState.createLink}
              className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
            >
              Go create
            </Link>
          </div>
        ) : null}
      </div>

      {/* 音乐详情弹窗 */}
      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          onClose={() => setSelectedMusic(null)}
          onRecreate={handleMusicRecreate}
          onDelete={handleMusicDelete}
        />
      )}

      {/* Cover 详情弹窗 */}
      {selectedCover && (
        <CoverDetailModal
          cover={selectedCover}
          onClose={() => setSelectedCover(null)}
          onRecreate={handleCoverRecreate}
          onDelete={handleCoverDelete}
        />
      )}

      {/* Voice 详情弹窗 */}
      {selectedVoice && (
        <VoiceDetailModal
          voice={selectedVoice}
          onClose={() => setSelectedVoice(null)}
          onRecreate={handleVoiceRecreate}
          onDelete={handleVoiceDelete}
        />
      )}

      {/* Dialogue 详情弹窗 */}
      {selectedDialogue && (
        <DialogueDetailModal
          dialogue={selectedDialogue}
          onClose={() => setSelectedDialogue(null)}
          onRecreate={handleDialogueRecreate}
          onDelete={handleDialogueDelete}
        />
      )}

      {/* Image 详情弹窗 */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onRecreate={handleImageRecreate}
          onDelete={handleImageDelete}
        />
      )}

      {/* Video 详情弹窗 */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onRecreate={handleVideoRecreate}
          onDelete={handleVideoDelete}
        />
      )}
    </div>
  );
}
