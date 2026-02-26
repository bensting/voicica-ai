'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getImageRecords, deleteImageRecord, getImageTaskStatus, type ImageRecord } from '@/actions/image';
import { useImageTaskPolling } from '@/hooks/useImageTaskPolling';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageCard } from '../cards';
import ImageDetailModal from '../ImageDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

const PAGE_SIZE = 20;

export default function ImageTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

  const fetchRecords = useCallback(async (offset = 0, isRefresh = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getImageRecords(PAGE_SIZE, offset);
      if (isRefresh || offset === 0) {
        setRecords(data);
      } else {
        setRecords((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch image records:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isActive && records.length === 0) fetchRecords(0);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isActive && refreshTrigger) fetchRecords(0, true);
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => fetchRecords(records.length);

  // 轮询处理中的任务
  useImageTaskPolling({
    records,
    enabled: isActive,
    onStatusUpdate: useCallback((taskId: string, status: Awaited<ReturnType<typeof getImageTaskStatus>>) => {
      setRecords((prev) =>
        prev.map((record) => {
          if (record.task_id === taskId) {
            return {
              ...record,
              status: status.status,
              image_url: status.imageUrl || record.image_url,
              error: status.error || record.error,
            };
          }
          return record;
        })
      );
    }, []),
  });

  const handleClick = (image: ImageRecord) => {
    if (image.status === 'SUCCESS') {
      setSelectedImage(image);
      onDetailOpen?.();
    }
  };

  const handleRecreate = (image: ImageRecord) => {
    const params = new URLSearchParams();
    if (image.prompt) params.set('prompt', image.prompt);
    router.push(`/native/create/image?${params.toString()}`);
    setSelectedImage(null);
  };

  const handleDelete = async (image: ImageRecord) => {
    await deleteImageRecord(image.id);
    setRecords((prev) => prev.filter((i) => i.id !== image.id));
  };

  const filtered = records.filter((i) => i.status !== 'FAILURE');

  if (loading && records.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstImage')}
        createLink="/native/create/image"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(i) => i.created_at?.toString() ?? ''}
        getKey={(i) => i.task_id}
        renderCard={(image) => (
          <ImageCard image={image} onClick={() => handleClick(image)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
