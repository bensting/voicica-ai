'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getVideoRecordByTaskId, deleteVideoRecord, type VideoRecord } from '@/actions/video';
import { useVideoTaskPolling } from '@/hooks/useVideoTaskPolling';
import { useLanguage } from '@/contexts/LanguageContext';
import { VideoCard } from '../cards';
import VideoDetailModal from '../VideoDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

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

const PAGE_SIZE = 20;

export default function VideoTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { token } = useFirebaseAuth();
  const { t } = useLanguage();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);

  const fetchVideos = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/v1/native/video/list?page=${pageNum}&limit=${PAGE_SIZE}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const newVideos = data.videos || [];
        if (isRefresh || pageNum === 1) {
          setVideos(newVideos);
          setPage(1);
        } else {
          setVideos((prev) => [...prev, ...newVideos]);
        }
        setHasMore(newVideos.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    if (isActive && videos.length === 0) fetchVideos(1);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isActive && refreshTrigger) fetchVideos(1, true);
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => fetchVideos(page + 1);

  // 轮询处理中的视频任务
  useVideoTaskPolling({
    videos,
    enabled: isActive,
    onStatusUpdate: useCallback((taskId: string, status: { status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'; progress: number; video_url?: string; error_message?: string }) => {
      setVideos((prev) =>
        prev.map((video) => {
          if (video.taskId === taskId) {
            return {
              ...video,
              status: status.status,
              progress: status.progress,
              videoUrl: status.video_url || video.videoUrl,
              errorMessage: status.error_message || video.errorMessage,
            };
          }
          return video;
        })
      );
    }, []),
  });

  const handleClick = async (video: VideoItem) => {
    if (video.status === 'SUCCESS') {
      const fullRecord = await getVideoRecordByTaskId(video.taskId);
      if (fullRecord) {
        setSelectedVideo(fullRecord);
        onDetailOpen?.();
      }
    }
  };

  const handleRecreate = (video: VideoRecord) => {
    const params = new URLSearchParams();
    if (video.prompt) params.set('prompt', video.prompt);
    router.push(`/native/create/video?${params.toString()}`);
    setSelectedVideo(null);
  };

  const handleDelete = async (video: VideoRecord) => {
    await deleteVideoRecord(String(video.id));
    setVideos((prev) => prev.filter((v) => v.taskId !== video.task_id));
    setSelectedVideo(null);
  };

  const filtered = videos.filter((v) => v.status !== 'FAILURE');

  if (loading && videos.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstVideo')}
        createLink="/native/create/video"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(v) => v.createdAt}
        getKey={(v) => v.taskId}
        renderCard={(video) => (
          <VideoCard video={video} onClick={() => handleClick(video)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
