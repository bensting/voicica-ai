'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getMusicRecords, getMusicTaskStatus, deleteMusicRecord, type MusicRecord } from '@/actions/music';
import { getTtsRecords, deleteTtsRecord, type TtsRecord } from '@/actions/tts';
import { getCoverRecords, deleteCoverRecord, type CoverRecord } from '@/actions/cover';

// 提取的组件
import MusicDetailModal from './MusicDetailModal';
import CoverDetailModal from './CoverDetailModal';
import VoiceDetailModal from './VoiceDetailModal';
import { MusicCard, CoverCard, VoiceCard } from './cards';
import { formatDateLong } from './utils';

type TabType = 'music' | 'cover' | 'voices';

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

const tabs: { id: TabType; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'cover', label: 'Cover' },
  { id: 'voices', label: 'Voices' },
];

const emptyStateMessages: Record<TabType, { title: string; subtitle: string; createLink: string }> = {
  music: {
    title: 'No content yet.',
    subtitle: 'Create your first AI music.',
    createLink: '/native/create/music',
  },
  cover: {
    title: 'No content yet.',
    subtitle: 'Create your first AI cover.',
    createLink: '/native/create/cover',
  },
  voices: {
    title: 'No content yet.',
    subtitle: 'Create your first voice.',
    createLink: '/native/create/voice',
  },
};

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

  // 从 URL 参数获取初始 tab
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const initialTab = tabFromUrl && ['music', 'cover', 'voices'].includes(tabFromUrl)
    ? tabFromUrl
    : 'music';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [musicRecords, setMusicRecords] = useState<MusicRecord[]>([]);
  const [voiceRecords, setVoiceRecords] = useState<TtsRecord[]>([]);
  const [coverRecords, setCoverRecords] = useState<CoverRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicRecord | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverRecord | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TtsRecord | null>(null);

  // 下拉刷新相关
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const PULL_THRESHOLD = 60;

  // 获取视频列表 (预留，暂未使用)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // 同步 URL 参数到 activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['videos', 'music', 'cover', 'images'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'music') {
      fetchMusic();
    } else if (activeTab === 'voices') {
      fetchVoices();
    } else if (activeTab === 'cover') {
      fetchCovers();
    }
  }, [activeTab, fetchMusic, fetchVoices, fetchCovers]);

  // 如果有正在处理的音乐，定时刷新（开发环境直接查询 KIE API）
  useEffect(() => {
    const processingRecords = musicRecords.filter(
      (m) => m.status === 'PENDING' || m.status === 'PROCESSING'
    );

    if (processingRecords.length === 0 || activeTab !== 'music') return;

    const interval = setInterval(async () => {
      // 开发环境下，为每个处理中的任务调用 getMusicTaskStatus
      // 这会触发 KIE API 直接查询并更新数据库
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('🎵 [MyCreations] 开发环境，查询处理中的音乐状态...');

        // 并行查询所有处理中的任务状态
        const statusResults = await Promise.all(
          processingRecords.map(async (record) => {
            try {
              const status = await getMusicTaskStatus(record.task_id);
              return { task_id: record.task_id, status };
            } catch (error) {
              console.error(`查询任务状态失败: ${record.task_id}`, error);
              return null;
            }
          })
        );

        // 更新本地状态
        setMusicRecords((prev) =>
          prev.map((record) => {
            const result = statusResults.find((r) => r?.task_id === record.task_id);
            if (result && result.status) {
              return {
                ...record,
                status: result.status.status,
                progress: result.status.progress,
                audio_url: result.status.result?.audio_url || record.audio_url,
                audio_url_2: result.status.result?.audio_url_2 || record.audio_url_2,
                cover_url: result.status.result?.cover_url || record.cover_url,
                cover_url_2: result.status.result?.cover_url_2 || record.cover_url_2,
                duration: result.status.result?.duration || record.duration,
                duration_2: result.status.result?.duration_2 || record.duration_2,
                title: result.status.result?.title || record.title,
                tags: result.status.result?.tags || record.tags,
                lyrics: result.status.result?.lyrics || record.lyrics,
              };
            }
            return record;
          })
        );
      } else {
        // 生产环境使用原有的重新获取列表方式
        await fetchMusic();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [musicRecords, activeTab, fetchMusic]);

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
      if (activeTab === 'music') {
        await fetchMusic(true);
      } else if (activeTab === 'voices') {
        await fetchVoices(true);
      } else if (activeTab === 'cover') {
        await fetchCovers(true);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVideoClick = (video: VideoItem) => {
    router.push(`/native/video/task/${video.taskId}`);
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

  // 过滤掉失败的记录
  const filteredMusicRecords = musicRecords.filter((m) => m.status !== 'FAILURE');
  const filteredVoiceRecords = voiceRecords.filter((v) => v.status !== 'FAILURE');
  const filteredCoverRecords = coverRecords.filter((c) => c.status !== 'FAILURE');

  const emptyState = emptyStateMessages[activeTab];
  const isEmpty = activeTab === 'music'
    ? filteredMusicRecords.length === 0
    : activeTab === 'voices'
    ? filteredVoiceRecords.length === 0
    : activeTab === 'cover'
    ? filteredCoverRecords.length === 0
    : true;

  // 按日期分组
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

  return (
    <div className="h-full flex flex-col">
      {/* 固定的标题和 Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 bg-[#0a0a1a]">
        {/* 标题 */}
        <h2 className="text-xl font-bold text-white mb-3">My Creations</h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
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
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        {activeTab === 'music' ? (
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
                Go create
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
                Go create
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
                Go create
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
    </div>
  );
}
