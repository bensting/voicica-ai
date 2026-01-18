'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

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

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
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
 * 显示用户创建的内容，支持 Tab 切换
 */
export default function MyCreations() {
  const router = useRouter();
  const { token, user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取视频列表
  const fetchVideos = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
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
    }
  }, [token]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'videos' && token) {
      fetchVideos();
    }
  }, [activeTab, token, fetchVideos]);

  // 如果有正在处理的视频，定时刷新
  useEffect(() => {
    const hasProcessing = videos.some(
      (v) => v.status === 'PENDING' || v.status === 'PROCESSING'
    );

    if (hasProcessing && activeTab === 'videos') {
      const interval = setInterval(fetchVideos, 5000); // 每 5 秒刷新
      return () => clearInterval(interval);
    }
  }, [videos, activeTab, fetchVideos]);

  const handleVideoClick = (video: VideoItem) => {
    router.push(`/native/video/task/${video.taskId}`);
  };

  const emptyState = emptyStateMessages[activeTab];
  const isEmpty = activeTab === 'videos' ? videos.length === 0 : true;

  return (
    <div className="px-4 pt-4 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-3">My Creations</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-800">
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

      {/* 内容区域 */}
      {activeTab === 'videos' ? (
        loading && videos.length === 0 ? (
          // 加载中
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          // 空状态
          <div className="flex flex-col items-center justify-center">
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
      ) : isEmpty ? (
        // 其他 tab 的空状态
        <div className="flex flex-col items-center justify-center">
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
  );
}
