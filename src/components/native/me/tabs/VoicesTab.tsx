'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTtsRecords, deleteTtsRecord, type TtsRecord } from '@/actions/tts';
import { useLanguage } from '@/contexts/LanguageContext';
import { VoiceCard } from '../cards';
import VoiceDetailModal from '../VoiceDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

const PAGE_SIZE = 20;

export default function VoicesTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [records, setRecords] = useState<TtsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<TtsRecord | null>(null);

  const fetchRecords = useCallback(async (offset = 0, isRefresh = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getTtsRecords(PAGE_SIZE, offset);
      if (isRefresh || offset === 0) {
        setRecords(data);
      } else {
        setRecords((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch voice records:', error);
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

  const handleClick = (voice: TtsRecord) => {
    if (voice.status === 'SUCCESS') {
      setSelectedVoice(voice);
      onDetailOpen?.();
    }
  };

  const handleRecreate = () => {
    if (selectedVoice?.style?.startsWith('fish:')) {
      router.push('/native/create/clone');
    } else {
      router.push('/native/create/voice');
    }
    setSelectedVoice(null);
  };

  const handleDelete = async (voice: TtsRecord) => {
    await deleteTtsRecord(String(voice.id));
    setRecords((prev) => prev.filter((v) => v.id !== voice.id));
  };

  const filtered = records.filter((v) => v.status !== 'FAILURE');

  if (loading && records.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstVoice')}
        createLink="/native/create/voice"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(v) => v.created_at.toString()}
        getKey={(v) => v.task_id}
        renderCard={(voice) => (
          <VoiceCard voice={voice} onClick={() => handleClick(voice)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedVoice && (
        <VoiceDetailModal
          voice={selectedVoice}
          onClose={() => setSelectedVoice(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
