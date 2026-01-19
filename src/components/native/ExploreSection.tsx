'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Tab 类型
type TabType = 'videos' | 'swap' | 'effects' | 'images';

const tabs: { id: TabType; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'swap', label: 'Swap' },
  { id: 'effects', label: 'Effects' },
  { id: 'images', label: 'Images' },
];

interface ExploreVideo {
  id: number;
  taskId: string;
  prompt: string;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  user: string;
  createdAt: string;
}

// 播放图标
const PlayIcon = () => (
  <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 浏览量图标
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

// 格式化数字
function formatViews(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// 随机渐变色（用于占位或无缩略图时）
const gradients = [
  'from-amber-600 to-orange-700',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-indigo-500 to-purple-600',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
];

/**
 * 懒加载视频预览组件
 * 只有进入视口才加载视频
 */
function LazyVideoPreview({
  src,
  fallbackGradient
}: {
  src: string;
  fallbackGradient: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前100px开始加载
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* 占位背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />

      {/* 视频预览 - 懒加载 */}
      {isInView && (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

/**
 * Explore 区域
 * 包含 Tabs 切换和瀑布流内容展示
 */
export default function ExploreSection() {
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videos, setVideos] = useState<ExploreVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取视频数据
  useEffect(() => {
    if (activeTab === 'videos') {
      fetchVideos();
    }
  }, [activeTab]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/native/explore/videos?limit=6');
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据宽高比获取 aspect class
  const getAspectClass = (aspectRatio: string, index: number) => {
    if (aspectRatio === '9:16') return 'aspect-[9/16]';
    if (aspectRatio === '1:1') return 'aspect-square';
    // 默认使用交错布局
    return index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square';
  };

  return (
    <div className="px-4 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-4">Explore</h2>

      {/* Tabs */}
      <div className="flex gap-6 mb-4 border-b border-gray-800">
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
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            // 加载骨架屏
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden bg-gray-800 animate-pulse ${
                  i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                }`}
              />
            ))
          ) : videos.length > 0 ? (
            videos.map((video, index) => (
              <Link
                key={video.id}
                href={`/native/video/play/${video.taskId}`}
                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${getAspectClass(video.aspectRatio, index)}`}
              >
                {/* 视频预览 - 懒加载 */}
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.prompt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : video.videoUrl ? (
                  <LazyVideoPreview
                    src={video.videoUrl}
                    fallbackGradient={gradients[index % gradients.length]}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}
                  />
                )}

                {/* 播放按钮 */}
                <div className="absolute top-3 right-3">
                  <PlayIcon />
                </div>

                {/* 底部信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="truncate max-w-[60%]">{video.user}</span>
                    <span className="flex items-center gap-1">
                      <EyeIcon />
                      {formatViews(video.viewCount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // 空状态
            <div className="col-span-2 text-center py-12 text-gray-500">
              No videos yet
            </div>
          )}
        </div>
      ) : (
        // 其他 Tab 的占位内容
        <div className="text-center py-12 text-gray-500">
          Coming soon...
        </div>
      )}
    </div>
  );
}
