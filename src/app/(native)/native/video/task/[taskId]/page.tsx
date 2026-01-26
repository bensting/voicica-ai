'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import GradientButton from '@/components/native/common/GradientButton';
import DetailActionBar from '@/components/native/me/DetailActionBar';
import { handleDownloadWithState } from '@/lib/native-download';

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

// 公开图标
const PublicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

// 私有图标
const PrivateIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
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
  is_public?: boolean;
}

// 模型名称映射
const modelNameMap: Record<string, string> = {
  'veo-3.1': 'Veo 3.1',
  'google:3@2': 'Veo 3.1',
  'sora-2': 'Sora 2',
  'vidu-2.0': 'Vidu 2.0',
  'pixverse-v5': 'Pixverse V5',
};

// 格式化错误信息
function formatErrorMessage(message: string | undefined): string {
  if (!message) return 'An error occurred during video generation';

  // 检测 HTML 内容
  if (message.includes('<!DOCTYPE') || message.includes('<html') || message.includes('<head>')) {
    // 尝试从 HTML 中提取关键信息
    const titleMatch = message.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1];
      // 提取错误码（如 522, 500 等）
      const codeMatch = title.match(/\d{3}/);
      if (codeMatch) {
        return `Server error (${codeMatch[0]}). Please try again later.`;
      }
      return 'Server error. Please try again later.';
    }
    return 'Server error. Please try again later.';
  }

  // 截断过长的消息
  if (message.length > 200) {
    return message.substring(0, 200) + '...';
  }

  return message;
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
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTaskStatus, task?.status]);

  const handleBack = () => {
    router.back();
  };

  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const handleToggleVisibility = async () => {
    if (!task || updatingVisibility) return;

    const newIsPublic = !task.is_public;

    try {
      setUpdatingVisibility(true);

      const response = await fetch(`/api/v1/native/video/task/${taskId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_public: newIsPublic }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      // 更新本地状态
      setTask((prev) => (prev ? { ...prev, is_public: newIsPublic } : null));
    } catch (err) {
      console.error('Toggle visibility failed:', err);
      alert('Failed to update visibility');
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (downloading) return;
    handleDownloadWithState(
      task?.video_url,
      `voicica_${taskId}.mp4`,
      setDownloading,
      'video'
    );
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

  const handleRecreate = () => {
    if (!task) return;
    const params = new URLSearchParams({
      prompt: task.prompt,
      model: task.model,
      aspectRatio: task.aspect_ratio,
    });
    router.push(`/native/create/video?${params.toString()}`);
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
    <div className="fixed inset-0 bg-[#0a0a1a] flex flex-col">
      {/* Header - 固定顶部 */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <button onClick={handleBack} className="p-2 -ml-2 text-white">
          <BackIcon />
        </button>
        <button className="p-2 -mr-2 text-white">
          <MoreIcon />
        </button>
      </div>

      {/* 视频区域 - 中间自适应 */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
        {/* 右侧操作按钮 */}
        {isSuccess && (
          <div className="absolute right-4 top-4 flex flex-col gap-4 z-10">
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

        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-white text-2xl font-medium">{task.progress}%</div>
            <div className="text-gray-400">Generating your video...</div>
          </div>
        )}

        {isSuccess && task.video_url && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 水印 */}
            <div className="absolute top-4 right-16 z-10 pointer-events-none">
              <span className="text-white/60 text-sm font-medium tracking-wide">Voicica AI</span>
            </div>

            <video
              src={task.video_url}
              controls
              controlsList="nodownload"
              autoPlay
              loop
              playsInline
              className="max-w-full max-h-full object-contain"
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
              {formatErrorMessage(task.error_message)}
            </div>
          </div>
        )}
      </div>

      {/* 底部信息区域 - 固定底部 */}
      <div
        className="flex-shrink-0 px-4 pb-4 bg-[#0a0a1a]"
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

        {/* 公开/私有切换 */}
        {isSuccess && (
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-gray-400">
              {task.is_public ? <PublicIcon /> : <PrivateIcon />}
              <span className="text-sm">{task.is_public ? 'Public' : 'Private'}</span>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={updatingVisibility}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                task.is_public ? 'bg-purple-600' : 'bg-gray-600'
              } ${updatingVisibility ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  task.is_public ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* 底部操作栏 */}
        {isSuccess && (
          <DetailActionBar
            showRecreate
            onRecreate={handleRecreate}
            showDownload
            onDownload={handleDownload}
            downloading={downloading}
          />
        )}

        {/* 失败时的重试按钮 */}
        {isFailed && (
          <GradientButton onClick={() => router.push('/native/create/video')}>
            <span>Try Again</span>
          </GradientButton>
        )}

        {/* 处理中的提示 */}
        {isProcessing && (
          <div className="text-center text-gray-400 text-sm py-4">
            Please wait while your video is being generated...
          </div>
        )}
      </div>

    </div>
  );
}
