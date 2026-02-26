'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMusicRecords, deleteMusicRecord, getMusicTaskStatus, type MusicRecord } from '@/actions/music';
import { useMusicTaskPolling } from '@/hooks/useMusicTaskPolling';
import { useLanguage } from '@/contexts/LanguageContext';
import { MusicCard } from '../cards';
import MusicDetailModal from '../MusicDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

const PAGE_SIZE = 20;

export default function MusicTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [records, setRecords] = useState<MusicRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<MusicRecord | null>(null);

  const fetchRecords = useCallback(async (offset = 0, isRefresh = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getMusicRecords(PAGE_SIZE, offset);
      if (isRefresh || offset === 0) {
        setRecords(data);
      } else {
        setRecords((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch music records:', error);
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
  useMusicTaskPolling({
    records,
    enabled: isActive,
    onStatusUpdate: useCallback((taskId: string, status: Awaited<ReturnType<typeof getMusicTaskStatus>>) => {
      setRecords((prev) =>
        prev.map((record) => {
          if (record.task_id === taskId) {
            return {
              ...record,
              status: status.status,
              progress: status.progress,
              audio_url: status.result?.audio_url || record.audio_url,
              audio_url_2: status.result?.audio_url_2 || record.audio_url_2,
              cover_url: status.result?.cover_url || record.cover_url,
              cover_url_2: status.result?.cover_url_2 || record.cover_url_2,
              duration: status.result?.duration || record.duration,
              duration_2: status.result?.duration_2 || record.duration_2,
              title: status.result?.title || record.title,
              tags: status.result?.tags || record.tags,
              lyrics: status.result?.lyrics || record.lyrics,
            };
          }
          return record;
        })
      );
    }, []),
  });

  const handleClick = (music: MusicRecord) => {
    if (music.status === 'SUCCESS') {
      setSelectedMusic(music);
      onDetailOpen?.();
    }
  };

  const handleRecreate = (music: MusicRecord) => {
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.style) params.set('style', music.style);
    if (music.model) params.set('model', music.model);
    router.push(`/native/create/music?${params.toString()}`);
    setSelectedMusic(null);
  };

  const handleDelete = async (music: MusicRecord) => {
    await deleteMusicRecord(music.id);
    setRecords((prev) => prev.filter((m) => m.id !== music.id));
  };

  const filtered = records.filter((m) => m.status !== 'FAILURE');

  if (loading && records.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstMusic')}
        createLink="/native/create/music"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(m) => m.created_at?.toString() ?? ''}
        getKey={(m) => m.task_id}
        renderCard={(music) => (
          <MusicCard music={music} onClick={() => handleClick(music)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          onClose={() => setSelectedMusic(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
