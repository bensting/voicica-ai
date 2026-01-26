'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import GradientButton from '@/components/native/common/GradientButton';

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
// Recreate 图标
const RecreateIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function PublicVideoPlayPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    // 检查是否有 from 参数，如果是从 explore 来的，返回到 explore
    const from = searchParams.get('from');
    if (from === 'explore') {
      router.push('/native?tab=explore');
    } else {
      router.back();
    }
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

  const handleRecreate = () => {
    if (!video) return;
    // 跳转到创建页面，带上 prompt 参数
    const params = new URLSearchParams({
      prompt: video.prompt,
      model: video.model,
      aspectRatio: video.aspectRatio,
    });
    router.push(`/native/create/video?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div
        className="fixed inset-0 bg-[#0a0a1a] flex flex-col"
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
    <div className="fixed inset-0 bg-[#0a0a1a] flex flex-col">
      {/* Header - 固定顶部 */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <button onClick={handleBack} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <div className="flex items-center">
          <button onClick={handleShare} className="p-2 text-white">
            <ShareIcon />
          </button>
          <button className="p-2 -mr-2 text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 视频区域 - 中间自适应 */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
        {video.videoUrl && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 水印 */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <span className="text-white/60 text-sm font-medium tracking-wide">Voicica AI</span>
            </div>

            <video
              src={video.videoUrl}
              controls
              controlsList="nodownload"
              autoPlay
              loop
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* 底部信息区域 - 固定底部 */}
      <div
        className="flex-shrink-0 px-4 pb-4 bg-[#0a0a1a]"
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
        <p className="text-white text-sm leading-relaxed line-clamp-2 mb-4">{video.prompt}</p>

        {/* 参数标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
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

        {/* Recreate 按钮 */}
        <GradientButton onClick={handleRecreate}>
          <RecreateIcon />
          <span>Recreate</span>
        </GradientButton>
      </div>
    </div>
  );
}

export default function PublicVideoPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#0a0a1a] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PublicVideoPlayPageContent />
    </Suspense>
  );
}
