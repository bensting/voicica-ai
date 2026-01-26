'use client';

import { useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

/**
 * 视频任务轮询 Hook
 *
 * 功能：
 * - 自动轮询处理中的视频任务状态
 * - 直接查询 KIE API 获取最新状态（通过后端 API）
 * - 超时处理：任务创建超过 30 分钟后停止轮询
 * - 支持回调更新状态
 */

interface VideoItem {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface VideoTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  video_url?: string;
  error_message?: string;
}

interface UseVideoTaskPollingOptions {
  /** 视频记录列表 */
  videos: VideoItem[];
  /** 是否启用轮询 */
  enabled?: boolean;
  /** 轮询间隔（毫秒），默认 5000 */
  interval?: number;
  /** 状态更新回调 */
  onStatusUpdate: (taskId: string, status: VideoTaskStatus) => void;
}

/**
 * 检查任务是否在超时时间内（30分钟）
 */
function isWithinTimeout(createdAt: string): boolean {
  const taskAgeMinutes = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60;
  return taskAgeMinutes < 30;
}

export function useVideoTaskPolling({
  videos,
  enabled = true,
  interval = 5000,
  onStatusUpdate,
}: UseVideoTaskPollingOptions) {
  const { token } = useFirebaseAuth();

  const pollTasks = useCallback(async () => {
    if (!token) return;

    // 筛选需要轮询的任务：处理中且未超时
    const processingVideos = videos.filter(
      (v) =>
        (v.status === 'PENDING' || v.status === 'PROCESSING') &&
        isWithinTimeout(v.createdAt)
    );

    if (processingVideos.length === 0) return;

    console.log(`🎬 [useVideoTaskPolling] 轮询 ${processingVideos.length} 个处理中的任务`);

    // 并行查询所有处理中的任务状态
    await Promise.all(
      processingVideos.map(async (video) => {
        try {
          const response = await fetch(`/api/v1/native/video/task/${video.taskId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.task) {
              onStatusUpdate(video.taskId, {
                task_id: data.task.task_id,
                status: data.task.status,
                progress: data.task.progress,
                video_url: data.task.video_url,
                error_message: data.task.error_message,
              });
            }
          }
        } catch (error) {
          console.error(`🎬 [useVideoTaskPolling] 查询任务状态失败: ${video.taskId}`, error);
        }
      })
    );
  }, [videos, token, onStatusUpdate]);

  useEffect(() => {
    if (!enabled || !token) return;

    // 检查是否有需要轮询的任务
    const hasProcessingTasks = videos.some(
      (v) =>
        (v.status === 'PENDING' || v.status === 'PROCESSING') &&
        isWithinTimeout(v.createdAt)
    );

    if (!hasProcessingTasks) return;

    // 立即执行一次
    void pollTasks();

    const pollInterval = setInterval(() => {
      void pollTasks();
    }, interval);

    return () => clearInterval(pollInterval);
  }, [enabled, videos, token, interval, pollTasks]);

  return { pollTasks };
}
