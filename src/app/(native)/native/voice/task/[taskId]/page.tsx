'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTtsRecordByTaskId } from '@/actions/tts';
import type { TtsRecord } from '@/actions/tts';
import GradientButton from '@/components/native/common/GradientButton';
import { downloadFile } from '@/lib/native-download';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 播放图标
const PlayIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 暂停图标
const PauseIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
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

// 重新生成图标
const RefreshIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

// 麦克风图标
const MicIcon = () => (
  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// 格式化时长
function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TTSTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TtsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 获取任务状态
  const fetchTaskStatus = useCallback(async () => {
    try {
      const record = await getTtsRecordByTaskId(taskId);
      setTask(record);
      setError(null);
    } catch (err) {
      console.error('Fetch task error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load task';
      // 将中文错误消息转换为英文
      if (errorMessage.includes('记录不存在')) {
        setError('Task not found');
      } else if (errorMessage.includes('无权访问')) {
        setError('Access denied');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // 初始加载和轮询
  useEffect(() => {
    fetchTaskStatus();

    // 只在 PENDING 或 PROCESSING 状态下轮询
    const interval = setInterval(() => {
      if (task?.status === 'PENDING' || task?.status === 'PROCESSING') {
        fetchTaskStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchTaskStatus, task?.status]);

  // 音频事件处理
  useEffect(() => {
    if (!task?.audio_url) return;

    const audio = new Audio(task.audio_url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      // 先移除事件监听，避免清理时触发错误
      audio.onloadedmetadata = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
    };
  }, [task?.audio_url]);

  const handleBack = () => {
    router.back();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = async () => {
    if (!task?.audio_url || downloading) return;
    setDownloading(true);
    try {
      const fileName = `voicica_tts_${taskId}.mp3`;
      const result = await downloadFile({
        url: task.audio_url,
        fileName,
        type: 'audio',
      });
      if (!result.success) {
        alert(`Download failed: ${result.error}`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!task?.share_id) return;

    const shareUrl = `${window.location.origin}/share/tts/${task.share_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI TTS Audio',
          text: task.text.substring(0, 100),
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleRetry = () => {
    router.push('/native/create/voice');
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
        <div className="flex items-center px-4 h-14">
          <button onClick={handleBack} className="p-2 -ml-2 text-white">
            <BackIcon />
          </button>
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
        <h1 className="text-white font-semibold">AI TTS</h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full" />
              <div
                className="absolute inset-0 w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{task.progress}%</span>
              </div>
            </div>
            <div className="text-gray-400 mt-4">Generating your audio...</div>
          </div>
        )}

        {/* Success State */}
        {isSuccess && task.audio_url && (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Voice Avatar or Icon */}
            <div className="mb-8">
              {task.voice?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.voice.avatar_url}
                  alt={task.voice.display_name || ''}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-4 border-purple-500/30 text-purple-400">
                  <MicIcon />
                </div>
              )}
            </div>

            {/* Voice Name */}
            <div className="text-center mb-6">
              <div className="text-white font-semibold text-lg">
                {task.voice?.display_name || task.voice_name}
              </div>
              <div className="text-gray-500 text-sm">
                {task.language} · {formatDuration(task.duration || 0)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-4">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white mb-8 hover:bg-purple-500 transition-colors"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <ShareIcon />
                </div>
                <span className="text-xs">Share</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  {downloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DownloadIcon />
                  )}
                </div>
                <span className="text-xs">{downloading ? 'Downloading...' : 'Download'}</span>
              </button>

              <button
                onClick={handleRetry}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <RefreshIcon />
                </div>
                <span className="text-xs">Regenerate</span>
              </button>
            </div>
          </div>
        )}

        {/* Failed State */}
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
              {task.error_message || 'An error occurred during audio generation'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div
        className="px-4 pb-4"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* Text Preview */}
        <div className="bg-gray-800/60 rounded-xl p-4 mb-4">
          <p className="text-gray-300 text-sm line-clamp-2">{task.text}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{task.character_count} characters</span>
            {task.credits_cost > 0 && (
              <>
                <span>·</span>
                <span>{task.credits_cost} credits</span>
              </>
            )}
          </div>
        </div>

        {/* Retry Button for Failed State */}
        {isFailed && (
          <GradientButton onClick={handleRetry}>
            <RefreshIcon />
            <span>Try Again</span>
          </GradientButton>
        )}

        {/* Processing Hint */}
        {isProcessing && (
          <div className="text-center text-gray-400 text-sm py-4">
            Please wait while your audio is being generated...
          </div>
        )}
      </div>
    </div>
  );
}
