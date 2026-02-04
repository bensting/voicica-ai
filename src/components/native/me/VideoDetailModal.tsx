'use client';

import { useState, useEffect, useRef } from 'react';
import type { VideoRecord } from '@/actions/video';
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
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

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
        contentType="video"
        contentId={video.task_id}
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
              {/* 预览封面（未播放时显示） */}
              {!isPlaying && (
                <div className="absolute inset-0 z-10">
                  {video.thumbnail_url ? (
                    // 有缩略图：用 img 显示
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt="Video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    // 无缩略图：用 video#t=0.1 加载第一帧
                    <video
                      src={`${video.video_url}#t=0.1`}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  {/* 播放按钮遮罩 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                src={video.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                loop
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <svg className="w-16 h-16 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M10 9l5 3-5 3V9z" />
              </svg>
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
