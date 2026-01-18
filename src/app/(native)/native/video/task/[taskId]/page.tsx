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

// 下载图标
const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

// 分享图标
const ShareIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// 重试图标
const RetryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
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

export default function VideoTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useFirebaseAuth();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<VideoTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, 3000); // 每 3 秒轮询一次

    return () => clearInterval(interval);
  }, [fetchTaskStatus, task?.status]);

  const handleBack = () => {
    router.push('/native');
  };

  const handleDownload = () => {
    if (task?.video_url) {
      window.open(task.video_url, '_blank');
    }
  };

  const handleShare = () => {
    if (task?.video_url && navigator.share) {
      navigator.share({
        title: 'AI Generated Video',
        text: task.prompt,
        url: task.video_url,
      });
    }
  };

  const handleRetry = () => {
    router.push('/native/create/video');
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
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <header
          className="sticky top-0 z-30 bg-[#0a0a1a]"
          style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center px-4 h-14">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
            >
              <BackIcon />
            </button>
            <h1 className="flex-1 text-center text-white font-semibold">Video Task</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-red-400 text-lg mb-4">{error || 'Task not found'}</div>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-700 text-white rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = task.status === 'PENDING' || task.status === 'PROCESSING';
  const isSuccess = task.status === 'SUCCESS';
  const isFailure = task.status === 'FAILURE';

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
          >
            <BackIcon />
          </button>
          <h1 className="flex-1 text-center text-white font-semibold">
            {isProcessing ? 'Generating...' : isSuccess ? 'Video Ready' : 'Generation Failed'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Video Preview Area */}
        <div className="aspect-video bg-gray-800/60 rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
          {isProcessing && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white text-lg">{task.progress}%</div>
              <div className="text-gray-400 text-sm">Generating your video...</div>
            </div>
          )}
          {isSuccess && task.video_url && (
            <video
              src={task.video_url}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          )}
          {isFailure && (
            <div className="flex flex-col items-center gap-4 p-4">
              <svg className="w-16 h-16 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div className="text-red-400 text-center">{task.error_message || 'Generation failed'}</div>
            </div>
          )}
        </div>

        {/* Progress Bar (only when processing) */}
        {isProcessing && (
          <div className="mb-6">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Info */}
        <div className="bg-gray-800/60 rounded-2xl p-4 space-y-3">
          <div>
            <div className="text-gray-400 text-sm">Prompt</div>
            <div className="text-white text-sm mt-1 line-clamp-3">{task.prompt}</div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-400">Model: </span>
              <span className="text-white">{task.model}</span>
            </div>
            <div>
              <span className="text-gray-400">Quality: </span>
              <span className="text-white">{task.resolution}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration: </span>
              <span className="text-white">{task.duration}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div
        className="p-4 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {isSuccess && (
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-4 rounded-2xl font-medium text-white bg-gray-700 flex items-center justify-center gap-2"
            >
              <DownloadIcon />
              <span>Download</span>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center gap-2"
            >
              <ShareIcon />
              <span>Share</span>
            </button>
          </div>
        )}
        {isFailure && (
          <button
            onClick={handleRetry}
            className="w-full py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center gap-2"
          >
            <RetryIcon />
            <span>Try Again</span>
          </button>
        )}
        {isProcessing && (
          <div className="text-center text-gray-400 text-sm">
            Please wait while your video is being generated...
          </div>
        )}
      </div>
    </div>
  );
}
