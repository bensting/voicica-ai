import { useState, useEffect, useCallback } from 'react';
import {
  queryTtsRecords,
  deleteTtsRecord,
  batchDeleteTtsRecords,
  downloadAudio,
  convertTtsRecordToGeneration
} from '@/lib/api/tts';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

interface UseGenerationHistoryProps {
  user: { uid: string } | null;
  authLoading?: boolean;
  pageSize?: number;
  accumulateData?: boolean; // For infinite scroll on mobile
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
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(TaskStatus.SUCCESS);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

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

      const response = await queryTtsRecords({
        status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
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

  // Handle user login/logout and fetch records when filters change
  // Wait for auth to complete before fetching to avoid duplicate queries
  useEffect(() => {
    // Don't fetch if still checking authentication status
    if (authLoading) {
      return;
    }

    // Fetch records for both authenticated and anonymous users
    // API client will handle authentication automatically:
    // - Authenticated users: use Firebase token
    // - Anonymous users: use device fingerprint

    // User is logged in, fetch records
    void fetchRecords();
  }, [user, authLoading, fetchRecords]);

  // Handle clear all records
  const handleClearAll = useCallback(async () => {
    try {
      // Fetch all records that match current filters
      const response = await queryTtsRecords({
        status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: 1,
        page_size: 10000,
      });

      const allMatchingIds = response.records.map(record => record.id);

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
      title: 'Delete Speech Generation',
      message: 'Are you sure you want to delete this speech generation? This action cannot be undone and the audio file will be permanently removed.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteTtsRecord(id);
          console.log(`✅ Record ${id} deleted successfully`);
          await fetchRecords();
        } catch (err) {
          console.error(`❌ Error deleting record ${id}:`, err);
          window.alert('Failed to delete record. Please try again.');
        }
      },
    });
  }, [fetchRecords]);

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