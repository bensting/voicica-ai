'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 分享图标
const ShareIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// 浏览量图标
const EyeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

interface PublicVideo {
  id: number;
  taskId: string;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  user: string;
  createdAt: string;
}

// 模型名称映射
const modelNameMap: Record<string, string> = {
  'veo-3.1': 'Veo 3.1',
  'google:3@2': 'Veo 3.1',
  'sora-2': 'Sora 2',
  'vidu-2.0': 'Vidu 2.0',
  'pixverse-v5': 'Pixverse V5',
  'pixverse:1@5-fast': 'Pixverse V5',
};

// 格式化数字
function formatViews(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * 公开视频播放页面
 */
export default function PublicVideoPlayPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [video, setVideo] = useState<PublicVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/v1/native/explore/videos/${taskId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Video not found');
          return;
        }

        setVideo(data.video);
      } catch (err) {
        console.error('Fetch video error:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [taskId]);

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share && video) {
      try {
        await navigator.share({
          title: 'Check out this AI video',
          text: video.prompt,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div
        className="min-h-screen bg-[#0a0a1a] flex flex-col"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center px-4 h-14">
          <button onClick={handleBack} className="p-2 -ml-2 text-white">
            <BackIcon />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-red-400 text-lg mb-4">{error || 'Video not found'}</div>
          <button onClick={handleBack} className="px-6 py-3 bg-gray-700 text-white rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const modelName = modelNameMap[video.model] || video.model;

  return (
    <div
      className="min-h-screen bg-[#0a0a1a] flex flex-col"
      style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={handleBack} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <button onClick={handleShare} className="p-2 -mr-2 text-white">
          <ShareIcon />
        </button>
      </div>

      {/* 视频区域 */}
      <div className="flex-1 flex items-center justify-center relative">
        {video.videoUrl && (
          <div className="relative w-full h-full">
            {/* 水印 */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <span className="text-white/60 text-sm font-medium tracking-wide">Voicica AI</span>
            </div>

            <video
              src={video.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* 底部信息区域 */}
      <div
        className="px-4 pb-4"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* 用户和浏览量 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm">{video.user}</span>
          <span className="flex items-center gap-1.5 text-gray-400 text-sm">
            <EyeIcon />
            {formatViews(video.viewCount)}
          </span>
        </div>

        {/* Prompt */}
        <p className="text-white text-sm leading-relaxed mb-4">{video.prompt}</p>

        {/* 参数标签 */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {modelName}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {video.resolution}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {video.aspectRatio}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {video.duration}s
          </span>
        </div>
      </div>
    </div>
  );
}
