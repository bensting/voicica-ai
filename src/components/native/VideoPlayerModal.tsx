'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { Share } from '@capacitor/share';
import PlayerModalHeader from './PlayerModalHeader';
import GradientButton from './common/GradientButton';

/**
 * 公开视频数据接口
 */
export interface PublicVideoData {
  id: number;
  taskId: string;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  viewCount: number;
  user: string;
  createdAt: string;
}

interface VideoPlayerModalProps {
  video: PublicVideoData;
  onClose: () => void;
  /** 重新创建回调 */
  onRecreate?: () => void;
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
 * 视频播放器弹窗组件
 * 用于 Explore 页面的公开视频
 */
export default function VideoPlayerModal({
  video,
  onClose,
  onRecreate,
}: VideoPlayerModalProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const { hideAll, showAll } = useBottomNav();

  // 隐藏顶部和底部导航栏
  useEffect(() => {
    hideAll();
    return () => showAll();
  }, [hideAll, showAll]);

  const displayPrompt = video.prompt?.substring(0, 100) || 'AI Video';
  const modelName = modelNameMap[video.model] || video.model;

  // 分享
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/share/video/${video.taskId}`;

      // 检查是否支持分享
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Check out this AI video',
          text: video.prompt,
          url: shareUrl,
          dialogTitle: 'Share Video',
        });
      } else {
        // 回退到复制链接
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Recreate
  const handleRecreate = () => {
    if (onRecreate) {
      onRecreate();
    } else {
      // 默认跳转到创建页面
      const params = new URLSearchParams({
        prompt: video.prompt,
        model: video.model,
        aspectRatio: video.aspectRatio,
      });
      router.push(`/native/create/video?${params.toString()}`);
      onClose();
    }
  };

  // 播放/暂停
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col">
      {/* 顶部导航 */}
      <PlayerModalHeader
        onClose={onClose}
        onShare={handleShare}
        isSharing={isSharing}
        contentType="video"
        contentId={video.taskId}
      />

      {/* 视频区域 - 中间自适应 */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden"
        onClick={handlePlayPause}
      >
        {video.videoUrl && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 水印 */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <span className="text-white/60 text-sm font-medium tracking-wide">Voicica AI</span>
            </div>

            {/* 视频未加载时的占位符 */}
            {!isVideoReady && !isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50 z-10">
                <div className="text-3xl font-bold text-white/80 mb-4">Voicica</div>
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl || undefined}
              className="max-w-full max-h-full object-contain"
              playsInline
              loop
              preload="metadata"
              onLoadedData={() => setIsVideoReady(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* 播放按钮遮罩（视频已加载但未播放时显示） */}
            {isVideoReady && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部信息区域 */}
      <div
        className="flex-shrink-0 px-4 pt-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* 用户和浏览量 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">{video.user}</span>
          <span className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            {formatViews(video.viewCount)}
          </span>
        </div>

        {/* Prompt */}
        <p className="text-white text-sm leading-relaxed line-clamp-2 mb-3">{displayPrompt}</p>

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
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Recreate</span>
        </GradientButton>
      </div>
    </div>
  );
}
