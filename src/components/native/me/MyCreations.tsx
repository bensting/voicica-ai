'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getMusicRecords, type MusicRecord } from '@/actions/music';

type TabType = 'videos' | 'music' | 'cover' | 'images';

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
  { id: 'videos', label: 'Videos' },
  { id: 'music', label: 'Music' },
  { id: 'cover', label: 'Cover' },
  { id: 'images', label: 'Images' },
];

const emptyStateMessages: Record<TabType, { title: string; subtitle: string; createLink: string }> = {
  videos: {
    title: 'No content yet.',
    subtitle: 'Create your first AI video work.',
    createLink: '/native/create/video',
  },
  music: {
    title: 'No content yet.',
    subtitle: 'Create your first AI music.',
    createLink: '/native/create/music',
  },
  cover: {
    title: 'No content yet.',
    subtitle: 'Create your first cover.',
    createLink: '/native/create/effect',
  },
  images: {
    title: 'No content yet.',
    subtitle: 'Create your first AI image.',
    createLink: '/native/create/image',
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

// 格式化日期 (短格式)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 格式化日期 (长格式，用于分组标题)
function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// 音乐卡片组件
function MusicCard({ music, onClick }: { music: MusicRecord; onClick: () => void }) {
  const isProcessing = music.status === 'PENDING' || music.status === 'PROCESSING';
  const isSuccess = music.status === 'SUCCESS';
  const isFailed = music.status === 'FAILURE';

  // 显示的标题
  const displayTitle = music.title || 'AI Music';
  // 显示的副标题 (prompt 的前 30 个字符)
  const displaySubtitle = music.prompt?.substring(0, 30) || '';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 封面图 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden">
        {isSuccess && music.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={music.cover_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[9px] font-medium">{music.progress}%</span>
              </div>
            )}
            {isFailed && (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {!isProcessing && !isFailed && (
              <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        {displaySubtitle && (
          <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
        )}
      </div>
    </button>
  );
}

// 视频卡片组件 - 统一使用正方形显示
function VideoCard({ video, onClick }: { video: VideoItem; onClick: () => void }) {
  const isProcessing = video.status === 'PENDING' || video.status === 'PROCESSING';
  const isSuccess = video.status === 'SUCCESS';
  const isFailed = video.status === 'FAILURE';

  return (
    <button onClick={onClick} className="flex flex-col w-full">
      {/* 正方形缩略图 */}
      <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group w-full">
        {/* 缩略图或占位 */}
        {isSuccess && video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.prompt}
            className="w-full h-full object-cover"
          />
        ) : isSuccess && video.videoUrl ? (
          <video
            src={video.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[10px] font-medium">{video.progress}%</span>
              </div>
            )}
            {isFailed && (
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-red-400 text-[10px]">Failed</span>
              </div>
            )}
          </div>
        )}

        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-500/80 rounded-full">
            <span className="text-white text-[9px] font-medium">Processing</span>
          </div>
        )}

        {/* 时长标签 */}
        {isSuccess && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{video.duration}s</span>
          </div>
        )}

        {/* Hover 遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* 日期 */}
      <span className="text-gray-500 text-[10px] mt-1 text-center">
        {formatDate(video.createdAt)}
      </span>
    </button>
  );
}

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
  const initialTab = tabFromUrl && ['videos', 'music', 'cover', 'images'].includes(tabFromUrl)
    ? tabFromUrl
    : 'videos';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [musicRecords, setMusicRecords] = useState<MusicRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // 同步 URL 参数到 activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['videos', 'music', 'cover', 'images'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'videos' && token) {
      fetchVideos();
    } else if (activeTab === 'music') {
      fetchMusic();
    }
  }, [activeTab, token, fetchVideos, fetchMusic]);

  // 如果有正在处理的视频，定时刷新
  useEffect(() => {
    const hasProcessing = videos.some(
      (v) => v.status === 'PENDING' || v.status === 'PROCESSING'
    );

    if (hasProcessing && activeTab === 'videos') {
      const interval = setInterval(() => fetchVideos(), 5000);
      return () => clearInterval(interval);
    }
  }, [videos, activeTab, fetchVideos]);

  // 如果有正在处理的音乐，定时刷新
  useEffect(() => {
    const hasProcessing = musicRecords.some(
      (m) => m.status === 'PENDING' || m.status === 'PROCESSING'
    );

    if (hasProcessing && activeTab === 'music') {
      const interval = setInterval(() => fetchMusic(), 5000);
      return () => clearInterval(interval);
    }
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
      if (activeTab === 'videos') {
        await fetchVideos(true);
      } else if (activeTab === 'music') {
        await fetchMusic(true);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleVideoClick = (video: VideoItem) => {
    router.push(`/native/video/task/${video.taskId}`);
  };

  const handleMusicClick = (music: MusicRecord) => {
    // TODO: 跳转到音乐详情页
    console.log('Music clicked:', music.task_id);
  };

  const emptyState = emptyStateMessages[activeTab];
  const isEmpty = activeTab === 'videos'
    ? videos.length === 0
    : activeTab === 'music'
      ? musicRecords.length === 0
      : true;

  // 按日期分组音乐记录
  const groupedMusicRecords = musicRecords.reduce((groups, music) => {
    const date = formatDateLong(music.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(music);
    return groups;
  }, {} as Record<string, MusicRecord[]>);

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
        {activeTab === 'videos' ? (
          loading && videos.length === 0 ? (
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
            // 视频列表 - 3列正方形网格
            <div className="grid grid-cols-3 gap-2">
              {videos.map((video) => (
                <VideoCard
                  key={video.taskId}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                />
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
    </div>
  );
}
