'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCoverRecords, deleteCoverRecord, type CoverRecord } from '@/actions/cover';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoverCard } from '../cards';
import CoverDetailModal from '../CoverDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

const PAGE_SIZE = 20;

export default function CoverTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [records, setRecords] = useState<CoverRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCover, setSelectedCover] = useState<CoverRecord | null>(null);

  const fetchRecords = useCallback(async (offset = 0, isRefresh = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getCoverRecords(PAGE_SIZE, offset);
      if (isRefresh || offset === 0) {
        setRecords(data);
      } else {
        setRecords((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch cover records:', error);
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

  const handleClick = (cover: CoverRecord) => {
    if (cover.status === 'SUCCESS') {
      setSelectedCover(cover);
      onDetailOpen?.();
    }
  };

  const handleRecreate = () => {
    router.push('/native/create/cover');
    setSelectedCover(null);
  };

  const handleDelete = async (cover: CoverRecord) => {
    await deleteCoverRecord(cover.id);
    setRecords((prev) => prev.filter((c) => c.id !== cover.id));
  };

  const filtered = records.filter((c) => c.status !== 'FAILURE');

  if (loading && records.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstCover')}
        createLink="/native/create/cover"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(c) => c.created_at?.toString() ?? ''}
        getKey={(c) => c.task_id}
        renderCard={(cover) => (
          <CoverCard cover={cover} onClick={() => handleClick(cover)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedCover && (
        <CoverDetailModal
          cover={selectedCover}
          onClose={() => setSelectedCover(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
