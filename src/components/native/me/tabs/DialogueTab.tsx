'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDialogueRecords, deleteDialogueRecord, getDialogueTaskStatus, type DialogueRecord } from '@/actions/dialogue';
import { useDialogueTaskPolling } from '@/hooks/useDialogueTaskPolling';
import { useLanguage } from '@/contexts/LanguageContext';
import { DialogueCard } from '../cards';
import DialogueDetailModal from '../DialogueDetailModal';
import { EmptyState, LoadingState, LoadMoreButton, DateGroupedList, type TabProps } from './shared';

const PAGE_SIZE = 20;

export default function DialogueTab({ isActive, refreshTrigger, onDetailOpen }: TabProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [records, setRecords] = useState<DialogueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDialogue, setSelectedDialogue] = useState<DialogueRecord | null>(null);

  const fetchRecords = useCallback(async (offset = 0, isRefresh = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getDialogueRecords(PAGE_SIZE, offset);
      if (isRefresh || offset === 0) {
        setRecords(data);
      } else {
        setRecords((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch dialogue records:', error);
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
  useDialogueTaskPolling({
    records,
    enabled: isActive,
    onStatusUpdate: useCallback((taskId: string, status: Awaited<ReturnType<typeof getDialogueTaskStatus>>) => {
      setRecords((prev) => {
        const updatedRecords = prev.map((record) => {
          if (record.task_id === taskId) {
            const updatedRecord = {
              ...record,
              status: status.status,
              progress: status.progress,
              audio_url: status.audioUrl || record.audio_url,
            };
            if (status.status === 'SUCCESS' && record.status !== 'SUCCESS') {
              setTimeout(() => {
                setSelectedDialogue(updatedRecord);
                onDetailOpen?.();
              }, 0);
            }
            return updatedRecord;
          }
          return record;
        });
        return updatedRecords;
      });
    }, [onDetailOpen]),
  });

  const handleClick = (dialogue: DialogueRecord) => {
    if (dialogue.status === 'SUCCESS') {
      setSelectedDialogue(dialogue);
      onDetailOpen?.();
    }
  };

  const handleRecreate = () => {
    router.push('/native/create/dialogue');
    setSelectedDialogue(null);
  };

  const handleDelete = async (dialogue: DialogueRecord) => {
    await deleteDialogueRecord(dialogue.id);
    setRecords((prev) => prev.filter((d) => d.id !== dialogue.id));
  };

  const filtered = records.filter((d) => d.status !== 'FAILURE');

  if (loading && records.length === 0) return <LoadingState />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('native.me.emptyState.noContent')}
        subtitle={t('native.me.emptyState.createFirstDialogue')}
        createLink="/native/create/dialogue"
      />
    );
  }

  return (
    <>
      <DateGroupedList
        records={filtered}
        getDateStr={(d) => d.created_at?.toString() ?? ''}
        getKey={(d) => d.task_id}
        renderCard={(dialogue) => (
          <DialogueCard dialogue={dialogue} onClick={() => handleClick(dialogue)} />
        )}
      />
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}

      {selectedDialogue && (
        <DialogueDetailModal
          dialogue={selectedDialogue}
          onClose={() => setSelectedDialogue(null)}
          onRecreate={handleRecreate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
