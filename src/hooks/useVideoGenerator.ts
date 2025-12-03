'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createVideoTask,
  getVideoTaskStatus,
  type VideoGenerationRequest,
  type VideoTaskStatus,
} from '@/actions/video';
import { calculateVideoCost, type VideoResolution, type VideoDuration } from '@/config/creditsCost';

interface UseVideoGeneratorOptions {
  onTaskSubmitted?: () => void;
  onTaskCompleted?: (videoUrl: string) => void;
  onTaskFailed?: (error: string) => void;
}

interface UseVideoGeneratorReturn {
  // State
  prompt: string;
  resolution: VideoResolution;
  duration: VideoDuration;
  aspectRatio: '16:9' | '9:16';
  model: string;
  isGenerating: boolean;
  progress: number;
  error: string | null;
  videoUrl: string | null;
  creditsCost: number;
  canGenerate: boolean;

  // Actions
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: VideoResolution) => void;
  setDuration: (duration: VideoDuration) => void;
  setAspectRatio: (aspectRatio: '16:9' | '9:16') => void;
  setModel: (model: string) => void;
  handleGenerate: () => Promise<void>;
  handleClearPrompt: () => void;
  reset: () => void;
}

const MIN_PROMPT_LENGTH = 10;
const POLL_INTERVAL = 3000; // 3 seconds

/**
 * Hook for video generation workflow
 */
export function useVideoGenerator(
  options: UseVideoGeneratorOptions = {}
): UseVideoGeneratorReturn {
  const { onTaskSubmitted, onTaskCompleted, onTaskFailed } = options;

  // State
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<VideoResolution>('768p');
  const [duration, setDuration] = useState<VideoDuration>(10);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [model, setModel] = useState('veo-3.1-generate-001');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [, setTaskId] = useState<string | null>(null);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Calculate credits cost
  const creditsCost = calculateVideoCost(resolution, duration);

  // Can generate check
  const canGenerate =
    prompt.trim().length >= MIN_PROMPT_LENGTH && !isGenerating && creditsCost > 0;

  // Cleanup polling on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll task status
  const pollTaskStatus = useCallback(
    async (tid: string) => {
      try {
        const status: VideoTaskStatus = await getVideoTaskStatus(tid);

        if (!isMountedRef.current) return;

        setProgress(status.progress);

        if (status.status === 'SUCCESS' && status.result) {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          setIsGenerating(false);
          setVideoUrl(status.result.video_url);
          setTaskId(null);
          onTaskCompleted?.(status.result.video_url);
        } else if (status.status === 'FAILURE') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          setIsGenerating(false);
          setError(status.error || 'Video generation failed');
          setTaskId(null);
          onTaskFailed?.(status.error || 'Video generation failed');
        }
      } catch (err) {
        console.error('[useVideoGenerator] Poll error:', err);
      }
    },
    [onTaskCompleted, onTaskFailed]
  );

  // Start polling
  const startPolling = useCallback(
    (tid: string) => {
      // Clear existing polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Start new polling
      pollIntervalRef.current = setInterval(() => {
        void pollTaskStatus(tid);
      }, POLL_INTERVAL);

      // Initial poll
      void pollTaskStatus(tid);
    },
    [pollTaskStatus]
  );

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);

    try {
      const request: VideoGenerationRequest = {
        prompt: prompt.trim(),
        resolution,
        duration,
        aspect_ratio: aspectRatio,
        model,
      };

      const result = await createVideoTask(request);

      if (!isMountedRef.current) return;

      if (result.status === 'FAILURE') {
        setIsGenerating(false);
        setError(result.error || 'Failed to create video task');
        onTaskFailed?.(result.error || 'Failed to create video task');
        return;
      }

      // Task submitted successfully
      setTaskId(result.task_id);
      onTaskSubmitted?.();

      // Start polling for status
      startPolling(result.task_id);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsGenerating(false);
      setError(errorMessage);
      onTaskFailed?.(errorMessage);
    }
  }, [
    canGenerate,
    prompt,
    resolution,
    duration,
    aspectRatio,
    model,
    onTaskSubmitted,
    onTaskFailed,
    startPolling,
  ]);

  // Clear prompt
  const handleClearPrompt = useCallback(() => {
    setPrompt('');
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setPrompt('');
    setResolution('768p');
    setDuration(10);
    setAspectRatio('16:9');
    setModel('veo-3.1-generate-001');
    setIsGenerating(false);
    setProgress(0);
    setError(null);
    setVideoUrl(null);
    setTaskId(null);
  }, []);

  return {
    // State
    prompt,
    resolution,
    duration,
    aspectRatio,
    model,
    isGenerating,
    progress,
    error,
    videoUrl,
    creditsCost,
    canGenerate,

    // Actions
    setPrompt,
    setResolution,
    setDuration,
    setAspectRatio,
    setModel,
    handleGenerate,
    handleClearPrompt,
    reset,
  };
}