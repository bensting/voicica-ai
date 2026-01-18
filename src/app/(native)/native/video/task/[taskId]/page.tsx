'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 更多菜单图标
const MoreIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

// Extend 图标
const ExtendIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M3 17h18M8 21h8" />
    <path d="M12 10v4M10 12h4" />
  </svg>
);

// Edit 图标
const EditIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// 删除图标
const DeleteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

// 下载图标
const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

interface VideoTask {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspect_ratio: string;
  video_url?: string;
  error_message?: string;
  created_at: string;
}

// 模型名称映射
const modelNameMap: Record<string, string> = {
  'veo-3.1': 'Veo 3.1',
  'google:3@2': 'Veo 3.1',
  'sora-2': 'Sora 2',
  'vidu-2.0': 'Vidu 2.0',
  'pixverse-v5': 'Pixverse V5',
};

export default function VideoTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useFirebaseAuth();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<VideoTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOption, setDownloadOption] = useState<'watermark' | 'no-watermark'>('watermark');

  // 获取任务状态
  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/native/video/task/${taskId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Task not found');
          return;
        }
        throw new Error('Failed to fetch task status');
      }

      const data = await response.json();
      setTask(data.task);
      setError(null);
    } catch (err) {
      console.error('Fetch task error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);

  // 初始加载和轮询
  useEffect(() => {
    fetchTaskStatus();

    // 只在 PENDING 或 PROCESSING 状态下轮询
    const interval = setInterval(() => {
      if (task?.status === 'PENDING' || task?.status === 'PROCESSING') {
        fetchTaskStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTaskStatus, task?.status]);

  const handleBack = () => {
    router.back();
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  const handleConfirmDownload = async () => {
    if (!task?.video_url || downloading) return;

    if (downloadOption === 'no-watermark') {
      // TODO: 检查用户是否有会员权限
      // 暂时直接下载
    }

    try {
      setDownloading(true);

      // 通过 fetch 下载视频为 Blob
      const response = await fetch(task.video_url);
      const blob = await response.blob();

      // 创建 Blob URL 并触发下载
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `voicica_${taskId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 释放 Blob URL
      URL.revokeObjectURL(blobUrl);
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed, please try again');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this video?')) {
      // TODO: 实现删除功能
      router.push('/native/me');
    }
  };

  const handleExtend = () => {
    // TODO: 跳转到 Extend 页面
    router.push(`/native/create/video?mode=extend&taskId=${taskId}`);
  };

  const handleEdit = () => {
    // TODO: 跳转到 Edit 页面
    router.push(`/native/create/video?mode=edit&taskId=${taskId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !task) {
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
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-red-400 text-lg mb-4">{error || 'Task not found'}</div>
          <button onClick={handleBack} className="px-6 py-3 bg-gray-700 text-white rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = task.status === 'PENDING' || task.status === 'PROCESSING';
  const isSuccess = task.status === 'SUCCESS';
  const isFailed = task.status === 'FAILURE';
  const modelName = modelNameMap[task.model] || task.model;

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
        <button className="p-2 -mr-2 text-white">
          <MoreIcon />
        </button>
      </div>

      {/* 右侧操作按钮 */}
      {isSuccess && (
        <div className="absolute right-4 top-20 flex flex-col gap-4 z-10">
          <button
            onClick={handleExtend}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
          >
            <ExtendIcon />
            <span className="text-xs">Extend</span>
          </button>
          <button
            onClick={handleEdit}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
          >
            <EditIcon />
            <span className="text-xs">Edit</span>
          </button>
        </div>
      )}

      {/* 视频区域 */}
      <div className="flex-1 flex items-center justify-center relative">
        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-white text-2xl font-medium">{task.progress}%</div>
            <div className="text-gray-400">Generating your video...</div>
          </div>
        )}

        {isSuccess && task.video_url && (
          <div className="relative w-full h-full">
            {/* 水印 */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <span className="text-white/60 text-sm font-medium tracking-wide">Voicica AI</span>
            </div>

            <video
              src={task.video_url}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {isFailed && (
          <div className="flex flex-col items-center gap-4 p-4">
            <svg
              className="w-20 h-20 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div className="text-red-400 text-center text-lg">Generation Failed</div>
            <div className="text-gray-500 text-sm text-center max-w-xs">
              {task.error_message || 'An error occurred during video generation'}
            </div>
          </div>
        )}
      </div>

      {/* 底部信息区域 */}
      <div
        className="px-4 pb-4"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* Prompt */}
        <div className="flex items-start gap-3 mb-4">
          <p className="flex-1 text-white text-sm leading-relaxed line-clamp-2">{task.prompt}</p>
          <button onClick={handleDelete} className="text-gray-500 hover:text-gray-300 p-1">
            <DeleteIcon />
          </button>
        </div>

        {/* 参数标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {modelName}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {task.resolution}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {task.aspect_ratio}
          </span>
          <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-gray-300 text-sm">
            {task.duration}s
          </span>
        </div>

        {/* 下载按钮 */}
        {isSuccess && (
          <button
            onClick={handleDownloadClick}
            className="w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 25%, #D946EF 50%, #EC4899 75%, #F97316 100%)',
            }}
          >
            <DownloadIcon />
            <span>Download</span>
          </button>
        )}

        {/* 失败时的重试按钮 */}
        {isFailed && (
          <button
            onClick={() => router.push('/native/create/video')}
            className="w-full py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center gap-2"
          >
            <span>Try Again</span>
          </button>
        )}

        {/* 处理中的提示 */}
        {isProcessing && (
          <div className="text-center text-gray-400 text-sm py-4">
            Please wait while your video is being generated...
          </div>
        )}
      </div>

      {/* 下载选项弹窗 */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDownloadModal(false)}
          />

          {/* 弹窗内容 */}
          <div
            className="relative w-full bg-[#1a1a2e] rounded-t-2xl p-4 pb-8"
            style={{ paddingBottom: 'calc(32px + var(--safe-area-inset-bottom, 0px))' }}
          >
            {/* 拖动指示条 */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* 选项 */}
            <div className="space-y-3 mb-6">
              {/* With Watermark */}
              <button
                onClick={() => setDownloadOption('watermark')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800/50"
              >
                <span className="text-white">With Watermark</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  downloadOption === 'watermark' ? 'border-blue-500' : 'border-gray-500'
                }`}>
                  {downloadOption === 'watermark' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>

              {/* Without Watermark */}
              <button
                onClick={() => setDownloadOption('no-watermark')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800/50"
              >
                <span className="text-white">Without Watermark<span className="ml-1">👑</span></span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  downloadOption === 'no-watermark' ? 'border-blue-500' : 'border-gray-500'
                }`}>
                  {downloadOption === 'no-watermark' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            </div>

            {/* 下载按钮 */}
            <button
              onClick={handleConfirmDownload}
              disabled={downloading}
              className="w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 25%, #D946EF 50%, #EC4899 75%, #F97316 100%)',
              }}
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <DownloadIcon />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
