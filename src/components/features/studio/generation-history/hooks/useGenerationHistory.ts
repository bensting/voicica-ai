import { useState, useEffect, useCallback, useRef } from 'react';
import {
  queryTtsRecords,
  deleteTtsRecord,
  batchDeleteTtsRecords,
  getTtsRecordById,
  checkAndHandleStuckTask,
} from '@/actions/tts';
import type { TtsRecord } from '@/actions/tts';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

// 格式化时间戳
function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString();
}

// 将 TtsRecord 转换为 Generation 格式
function convertTtsRecordToGeneration(record: TtsRecord): Generation {
  return {
    id: String(record.id),
    text: record.text,
    timestamp: formatTimestamp(record.created_at),
    duration: record.duration || 0,
    characterCount: record.character_count,
    audioUrl: record.audio_url || '',
    status: record.status as TaskStatus,
    progress: record.progress,
    errorMessage: record.error_message ?? undefined,
    voiceName: record.voice_name,
    voiceDisplayName: record.voice?.display_name ?? undefined,
    voiceAvatar: record.voice?.avatar_url ?? undefined,
  };
}

// 下载音频文件
async function downloadAudio(audioUrl: string, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

interface UseGenerationHistoryProps {
  user: { uid: string } | null;
  authLoading?: boolean;
  pageSize?: number;
  accumulateData?: boolean; // For infinite scroll on mobile
  defaultStatus?: TaskStatus | TaskStatus[] | null; // 默认状态过滤
  onTaskCompleted?: () => void; // 任务完成时的回调（用于刷新积分）
  // 国际化翻译函数
  t?: (key: string) => string;
}

interface UseGenerationHistoryReturn {
  // State
  loading: boolean;
  error: string | null;
  generations: Generation[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  selectedStatus: TaskStatus | null;
  startDate: string | null;
  endDate: string | null;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  };

  // Actions
  handleClearAll: () => void;
  handleDeleteGeneration: (id: string) => void;
  handleDownloadGeneration: (id: string) => Promise<void>;
  handlePageChange: (page: number) => void;
  handleStatusChange: (status: TaskStatus | null) => void;
  handleDateRangeChange: (start: string | null, end: string | null) => void;
  closeConfirmDialog: () => void;
  fetchRecords: () => Promise<void>;
}

/**
 * Custom hook for Generation History business logic
 *
 * Handles:
 * - Data fetching with filters and pagination
 * - CRUD operations (delete single/batch, download)
 * - Confirmation dialogs
 * - Error handling
 */
export function useGenerationHistory({
  user,
  authLoading = false,
  pageSize: initialPageSize = 20,
  accumulateData = false,
  defaultStatus = TaskStatus.SUCCESS,
  onTaskCompleted,
  t,
}: UseGenerationHistoryProps): UseGenerationHistoryReturn {
  // Data state
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  // For filter UI, we only support single status selection
  // But we use defaultStatus (which can be array) directly for API calls
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(
    Array.isArray(defaultStatus) ? null : defaultStatus
  );
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Polling for processing records - 使用 Map 存储每个记录的轮询定时器
  const pollingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Track retry counts for each record to prevent infinite polling on errors
  const pollingRetryCountRef = useRef<Map<string, number>>(new Map());
  // Track previous status of each record to detect completion
  const previousStatusRef = useRef<Map<string, TaskStatus>>(new Map());
  const MAX_RETRY_ATTEMPTS = 20; // Stop polling after 20 failed attempts (~1 minute)

  // Keep track of the actual status filter to use (can be array or single value)
  const statusFilter = useRef<TaskStatus | TaskStatus[] | null>(defaultStatus);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch records from API
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use statusFilter.current (which can be array) for API calls
      // or selectedStatus if user changed the filter in UI
      const actualStatus = selectedStatus !== null ? selectedStatus : statusFilter.current;

      // Convert status to string format for API
      let statusParam: string | undefined;
      if (Array.isArray(actualStatus)) {
        statusParam = actualStatus.join(',');
      } else if (actualStatus) {
        statusParam = actualStatus;
      }

      const response = await queryTtsRecords({
        status: statusParam,
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
        page: currentPage,
        page_size: pageSize,
      });

      // Convert TtsRecord to Generation format
      const convertedGenerations = response.records.map(convertTtsRecordToGeneration);

      // Accumulate data for infinite scroll or replace for pagination
      if (accumulateData && currentPage > 1) {
        setGenerations(prev => {
          // Get existing IDs
          const existingIds = new Set(prev.map(g => g.id));
          // Filter out duplicates from new data
          const newData = convertedGenerations.filter(g => !existingIds.has(g.id));
          return [...prev, ...newData];
        });
      } else {
        setGenerations(convertedGenerations);
      }
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error('❌ Error fetching TTS records:', err);
      setError('Failed to load generation history. Please try again later.');
      setGenerations([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, startDate, endDate, currentPage, pageSize, accumulateData]);

  // Clear all polling timers
  const clearAllPolling = useCallback(() => {
    pollingTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    pollingTimersRef.current.clear();
    pollingRetryCountRef.current.clear();
  }, []);

  // Clear specific record's polling timer and retry count
  const clearRecordPolling = useCallback((recordId: string) => {
    const timer = pollingTimersRef.current.get(recordId);
    if (timer) {
      clearTimeout(timer);
      pollingTimersRef.current.delete(recordId);
    }
    pollingRetryCountRef.current.delete(recordId);
  }, []);

  // Poll single record status with retry limit and timeout handling
  const pollRecordStatus = useCallback(async (recordId: string) => {
    try {
      console.log(`🔄 [useGenerationHistory] Polling record ${recordId}`);

      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        console.error(`❌ [useGenerationHistory] Invalid record ID: ${recordId}`);
        clearRecordPolling(recordId);
        return;
      }

      const record = await getTtsRecordById(numericId);
      const updatedGeneration = convertTtsRecordToGeneration(record);

      // Reset retry count on successful fetch
      pollingRetryCountRef.current.set(recordId, 0);

      // 检测状态变化：从 PROCESSING/PENDING → SUCCESS/FAILURE
      const previousStatus = previousStatusRef.current.get(recordId);
      const isProcessing = record.status === TaskStatus.PROCESSING || record.status === TaskStatus.PENDING;
      const wasProcessing = previousStatus === TaskStatus.PROCESSING || previousStatus === TaskStatus.PENDING;
      const isCompleted = record.status === TaskStatus.SUCCESS || record.status === TaskStatus.FAILURE;

      // 如果状态从处理中变为完成，触发回调
      if (wasProcessing && isCompleted && onTaskCompleted) {
        console.log(`💰 [useGenerationHistory] 任务 ${recordId} 完成，刷新积分`);
        onTaskCompleted();
      }

      // 更新状态追踪
      previousStatusRef.current.set(recordId, record.status as TaskStatus);

      // Update only this record in the list
      setGenerations(prev => prev.map(gen =>
        gen.id === recordId ? updatedGeneration : gen
      ));

      // If still processing, check if task is stuck (> 5 minutes)
      if (isProcessing) {
        const taskAge = Date.now() - new Date(record.created_at).getTime();
        const taskAgeMinutes = taskAge / 1000 / 60;
        const TIMEOUT_THRESHOLD_MINUTES = 5;

        // 如果任务超过5分钟,立即触发后台检查
        if (taskAgeMinutes > TIMEOUT_THRESHOLD_MINUTES) {
          console.warn(`⚠️ [useGenerationHistory] Task ${recordId} has been running for ${taskAgeMinutes.toFixed(1)} minutes, triggering timeout check`);

          try {
            const result = await checkAndHandleStuckTask(numericId);
            console.log(`✅ [useGenerationHistory] Timeout check completed for record ${recordId}:`, result.message);

            // 更新记录状态
            const timeoutUpdatedGeneration = convertTtsRecordToGeneration(result.record);
            setGenerations(prev => prev.map(gen =>
              gen.id === recordId ? timeoutUpdatedGeneration : gen
            ));

            // 停止轮询
            clearRecordPolling(recordId);

            // 如果任务被标记为失败,显示通知
            if (result.handled && result.newStatus === 'FAILURE') {
              console.error(`❌ [useGenerationHistory] Task ${recordId} marked as failed: ${result.message}`);
            }
          } catch (backendErr) {
            console.error(`❌ [useGenerationHistory] Timeout check failed for record ${recordId}:`, backendErr);
            // 即使后端检查失败,也停止轮询
            clearRecordPolling(recordId);
          }

          return;
        }

        // 任务还在正常时间范围内,继续轮询
        const timer = setTimeout(() => {
          void pollRecordStatus(recordId);
        }, 2000); // Poll every 2 seconds

        pollingTimersRef.current.set(recordId, timer);
      } else {
        // Record completed or failed, stop polling
        clearRecordPolling(recordId);
        console.log(`✅ [useGenerationHistory] Record ${recordId} completed with status ${record.status}`);
      }
    } catch (err) {
      console.error(`❌ [useGenerationHistory] Error polling record ${recordId}:`, err);

      // Increment retry count
      const currentRetries = pollingRetryCountRef.current.get(recordId) || 0;
      const newRetries = currentRetries + 1;

      // Check if max retries exceeded - trigger backend check
      if (newRetries >= MAX_RETRY_ATTEMPTS) {
        console.warn(`⚠️ [useGenerationHistory] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached for record ${recordId}`);
        console.log(`🔧 [useGenerationHistory] Triggering backend timeout check for record ${recordId}`);

        try {
          // 调用后端检查任务是否超时
          const numericId = parseInt(recordId, 10);
          const result = await checkAndHandleStuckTask(numericId);

          console.log(`✅ [useGenerationHistory] Backend check completed for record ${recordId}:`, result.message);

          // 更新记录状态
          const updatedGeneration = convertTtsRecordToGeneration(result.record);
          setGenerations(prev => prev.map(gen =>
            gen.id === recordId ? updatedGeneration : gen
          ));

          // 停止轮询
          clearRecordPolling(recordId);

          // 如果任务被标记为失败，显示通知
          if (result.handled && result.newStatus === 'FAILURE') {
            console.error(`❌ [useGenerationHistory] Task ${recordId} marked as failed: ${result.message}`);
            // TODO: 可以在这里显示用户友好的通知
          }
        } catch (backendErr) {
          console.error(`❌ [useGenerationHistory] Backend timeout check failed for record ${recordId}:`, backendErr);
          // 即使后端检查失败，也停止轮询，避免无限循环
          clearRecordPolling(recordId);
        }

        return;
      }

      // Update retry count and continue polling
      pollingRetryCountRef.current.set(recordId, newRetries);
      console.log(`🔄 [useGenerationHistory] Retry ${newRetries}/${MAX_RETRY_ATTEMPTS} for record ${recordId}`);

      const timer = setTimeout(() => {
        void pollRecordStatus(recordId);
      }, 3000); // Retry after 3 seconds on error

      pollingTimersRef.current.set(recordId, timer);
    }
  }, [clearRecordPolling, MAX_RETRY_ATTEMPTS, onTaskCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllPolling();
    };
  }, [clearAllPolling]);

  // Handle user login/logout and fetch records when filters change
  // Wait for auth to complete before fetching to avoid duplicate queries
  useEffect(() => {
    // Don't fetch if still checking authentication status
    if (authLoading) {
      console.log('🔄 [useGenerationHistory] 等待认证完成，跳过 fetchRecords');
      return;
    }

    console.log('🔄 [useGenerationHistory] useEffect 触发 fetchRecords', { user: !!user, authLoading });

    // Fetch records for both authenticated and anonymous users
    // API client will handle authentication automatically:
    // - Authenticated users: use Firebase token
    // - Anonymous users: use device fingerprint

    // User is logged in, fetch records
    void fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // 移除 fetchRecords 依赖，避免无限循环

  // Fetch records when page, filters, or status changes
  useEffect(() => {
    if (authLoading) return;

    console.log('🔄 [useGenerationHistory] Filters/Page changed, fetching records', {
      currentPage,
      selectedStatus,
      startDate,
      endDate
    });

    void fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatus, startDate, endDate]); // Trigger fetch when filters/page change

  // Smart polling for processing records - poll each record individually
  useEffect(() => {
    if (loading) return;

    // Get all processing/pending records
    const processingRecords = generations.filter(
      gen => gen.status === TaskStatus.PROCESSING || gen.status === TaskStatus.PENDING
    );

    // Get currently polling record IDs
    const currentlyPolling = new Set(pollingTimersRef.current.keys());

    // Start polling for new processing records
    processingRecords.forEach(gen => {
      if (!currentlyPolling.has(gen.id)) {
        console.log(`🔄 [useGenerationHistory] Starting polling for record ${gen.id}`);
        void pollRecordStatus(gen.id);
      }
    });

    // Stop polling for records that are no longer processing
    const processingIds = new Set(processingRecords.map(gen => gen.id));
    currentlyPolling.forEach(recordId => {
      if (!processingIds.has(recordId)) {
        console.log(`⏹️ [useGenerationHistory] Stopping polling for record ${recordId}`);
        clearRecordPolling(recordId);
      }
    });
  }, [generations, loading, pollRecordStatus, clearRecordPolling]);

  // Handle clear all records
  const handleClearAll = useCallback(async () => {
    try {
      // Fetch all records that match current filters
      const response = await queryTtsRecords({
        status: selectedStatus ?? undefined,
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
        page: 1,
        page_size: 10000,
      });

      const allMatchingIds = response.records.map(record => String(record.id));

      if (allMatchingIds.length === 0) {
        window.alert('No records to delete.');
        return;
      }

      setConfirmDialog({
        isOpen: true,
        title: 'Delete All Records',
        message: `Are you sure you want to delete all ${allMatchingIds.length} record(s)? This action cannot be undone and all audio files will be permanently removed.`,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          try {
            const result = await batchDeleteTtsRecords(allMatchingIds);
            console.log(`✅ Batch delete completed: ${result.deleted} deleted, ${result.failed} failed`);
            await fetchRecords();
          } catch (err) {
            console.error('❌ Error clearing all records:', err);
            window.alert('Failed to clear all records. Please try again.');
          }
        },
      });
    } catch (err) {
      console.error('❌ Error fetching records for deletion:', err);
      window.alert('Failed to fetch records. Please try again.');
    }
  }, [selectedStatus, startDate, endDate, fetchRecords]);

  // Handle delete single generation
  const handleDeleteGeneration = useCallback((id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t ? t('studio.deleteDialog.title') : 'Delete Speech Generation',
      message: t ? t('studio.deleteDialog.message') : 'Are you sure you want to delete this speech generation? This action cannot be undone and the audio file will be permanently removed.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteTtsRecord(id);
          console.log(`✅ Record ${id} deleted successfully`);
          await fetchRecords();
        } catch (err) {
          console.error(`❌ Error deleting record ${id}:`, err);
          window.alert(t ? t('studio.deleteDialog.deleteFailedAlert') : 'Failed to delete record. Please try again.');
        }
      },
    });
  }, [fetchRecords, t]);

  // Handle download generation
  const handleDownloadGeneration = useCallback(async (id: string) => {
    try {
      const generation = generations.find(gen => gen.id === id);
      if (!generation || !generation.audioUrl) {
        window.alert('Audio file not available for download.');
        return;
      }

      const filename = `tts-${id}.mp3`;
      await downloadAudio(generation.audioUrl, filename);
      console.log(`✅ Audio ${id} downloaded successfully`);
    } catch (err) {
      console.error(`❌ Error downloading audio ${id}:`, err);
      window.alert('Failed to download audio. Please try again.');
    }
  }, [generations]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle status filter change
  const handleStatusChange = useCallback((status: TaskStatus | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page
    setGenerations([]); // Clear accumulated data when filter changes
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Reset to first page
    setGenerations([]); // Clear accumulated data when filter changes
  }, []);

  // Close confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // State
    loading,
    error,
    generations,
    total,
    currentPage,
    pageSize,
    totalPages,
    selectedStatus,
    startDate,
    endDate,
    confirmDialog,

    // Actions
    handleClearAll,
    handleDeleteGeneration,
    handleDownloadGeneration,
    handlePageChange,
    handleStatusChange,
    handleDateRangeChange,
    closeConfirmDialog,
    fetchRecords,
  };
}