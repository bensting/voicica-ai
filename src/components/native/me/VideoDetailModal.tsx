'use client';

import { useState, useEffect, useRef } from 'react';
import type { VideoRecord } from '@/actions/video';
import { createShareLink } from '@/actions/share';
import DetailModalHeader from './DetailModalHeader';
import DetailActionBar from './DetailActionBar';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';
import { useBottomNav } from '@/contexts/BottomNavContext';

interface VideoDetailModalProps {
  video: VideoRecord;
  onClose: () => void;
  onRecreate: (video: VideoRecord) => void;
  onDelete: (video: VideoRecord) => void;
}

// 模型名称映射
const modelDisplayNames: Record<string, string> = {
  'kling-v2-master': 'Kling v2 Master',
  'kling-v2-pro': 'Kling v2 Pro',
  'kling-v1.5-pro': 'Kling v1.5 Pro',
  'kling-v1-pro': 'Kling v1 Pro',
  'hailuo-t2v-01': 'Hailuo T2V',
  'wan-t2v-v2': 'Wan T2V v2',
};

function getModelDisplayName(modelId: string): string {
  return modelDisplayNames[modelId] || modelId;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  return `${seconds}s`;
}

// 根据 aspect_ratio 计算 padding-bottom 百分比
function getAspectRatioPadding(aspectRatio: string): string {
  // 解析 "16:9" 或 "9:16" 格式
  const parts = aspectRatio.split(':');
  if (parts.length === 2) {
    const width = parseFloat(parts[0]);
    const height = parseFloat(parts[1]);
    if (width > 0 && height > 0) {
      return `${(height / width) * 100}%`;
    }
  }
  // 默认 16:9
  return '56.25%';
}

// 判断是否为竖屏视频
function isPortraitVideo(aspectRatio: string): boolean {
  const parts = aspectRatio.split(':');
  if (parts.length === 2) {
    const width = parseFloat(parts[0]);
    const height = parseFloat(parts[1]);
    return height > width;
  }
  return false;
}

export default function VideoDetailModal({
  video,
  onClose,
  onRecreate,
  onDelete,
}: VideoDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  // 预先生成分享链接（用于"在浏览器打开"功能）
  useEffect(() => {
    if (video.task_id) {
      createShareLink('video', video.task_id)
        .then((result) => setShareUrl(result.url))
        .catch((err) => console.error('Failed to create share link:', err));
    }
  }, [video.task_id]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(video);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <DetailModalHeader
        onClose={onClose}
        onDelete={() => setShowDeleteDialog(true)}
        browserUrl={shareUrl || undefined}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Video Player */}
        <div
          className={`relative rounded-2xl overflow-hidden bg-gray-800 mb-4 mx-auto ${
            isPortraitVideo(video.aspect_ratio) ? 'max-w-[280px]' : 'w-full'
          }`}
          style={{ paddingBottom: getAspectRatioPadding(video.aspect_ratio) }}
          onClick={handlePlayPause}
        >
          {video.video_url ? (
            <>
              {/* 视频未加载时的占位符 */}
              {!isVideoReady && !isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50 z-10">
                  <div className="text-2xl font-bold text-white/80 mb-3">Voicica</div>
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                loop
                preload="metadata"
                onLoadedData={() => setIsVideoReady(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {/* Play Button Overlay（视频已加载但未播放时显示） */}
              {isVideoReady && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
              <div className="text-2xl font-bold text-white/80 mb-3">Voicica</div>
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Model & Settings */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-800 rounded">{getModelDisplayName(video.model)}</span>
            <span className="px-2 py-1 bg-gray-800 rounded">{video.aspect_ratio}</span>
            <span className="px-2 py-1 bg-gray-800 rounded">{video.resolution}</span>
            <span className="px-2 py-1 bg-gray-800 rounded">{formatDuration(video.actual_duration || video.duration)}</span>
          </div>

          {/* Prompt */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Prompt</h3>
            <p className="text-white text-sm leading-relaxed">{video.prompt}</p>
          </div>

          {/* Credits Used */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits used</span>
            <span className="text-white">{video.credits_cost}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#0a0a1a]/95 backdrop-blur-sm border-t border-gray-800"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <DetailActionBar
          onRecreate={() => onRecreate(video)}
          fileUrl={video.video_url || undefined}
          fileName={`voicica_video_${video.task_id}.mp4`}
          fileType="video"
        />
      </div>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this video?"
      />
    </div>
  );
}
