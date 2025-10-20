'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/features/auth/LoginForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GenerationHistory from '@/components/features/generation-history/GenerationHistory';
import {
  queryTtsRecords,
  deleteTtsRecord,
  batchDeleteTtsRecords,
  downloadAudio,
  convertTtsRecordToGeneration
} from '@/lib/api/tts';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

export default function GenerationHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      setGenerations(convertedGenerations);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error('Error fetching TTS records:', err);
      setError('Failed to load generation history. Please try again later.');
      setGenerations([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, startDate, endDate, currentPage, pageSize]);

  // Fetch records on mount and when filters/pagination change (only if user is logged in)
  useEffect(() => {
    if (user) {
      void fetchRecords();
    }
  }, [user, fetchRecords]);

  // Handle clear all records
  const handleClearAll = async () => {
    try {
      // First, fetch all records that match current filters (without pagination limit)
      const response = await queryTtsRecords({
        status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: 1,
        page_size: 10000, // Get all matching records
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
            // Pass all matching record IDs to delete
            const result = await batchDeleteTtsRecords(allMatchingIds);
            console.log(`Batch delete completed: ${result.deleted} deleted, ${result.failed} failed`);
            // Refresh the list (fetchRecords will handle loading state)
            await fetchRecords();
          } catch (err) {
            console.error('Error clearing all records:', err);
            window.alert('Failed to clear all records. Please try again.');
          }
        },
      });
    } catch (err) {
      console.error('Error fetching records for deletion:', err);
      window.alert('Failed to fetch records. Please try again.');
    }
  };

  // Handle delete single generation
  const handleDeleteGeneration = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Speech Generation',
      message: 'Are you sure you want to delete this speech generation? This action cannot be undone and the audio file will be permanently removed.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteTtsRecord(id);
          // Refresh the list
          await fetchRecords();
        } catch (err) {
          console.error('Error deleting record:', err);
          window.alert('Failed to delete record. Please try again.');
        }
      },
    });
  };

  // Handle download generation
  const handleDownloadGeneration = async (id: string) => {
    try {
      const generation = generations.find(gen => gen.id === id);
      if (!generation || !generation.audioUrl) {
        window.alert('Audio file not available for download.');
        return;
      }

      const filename = `tts-${id}.mp3`;
      await downloadAudio(generation.audioUrl, filename);
    } catch (err) {
      console.error('Error downloading audio:', err);
      window.alert('Failed to download audio. Please try again.');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle status filter change
  const handleStatusChange = (status: TaskStatus | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle date range change
  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!user) {
    const handleOverlayClick = () => {
      // Go back to previous page when clicking outside the modal
      window.history.back();
    };

    const handleModalClick = (e: React.MouseEvent) => {
      // Prevent closing when clicking inside the modal
      e.stopPropagation();
    };

    return (
      <div className="min-h-screen bg-gray-50 pt-20 relative">
        {/* Blurred background content */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Generation History</h1>
                <p className="text-gray-600">View and manage your TTS generation history</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-96"></div>
            </div>
          </div>
        </div>

        {/* Login Modal Overlay - Click to close */}
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 cursor-pointer"
          onClick={handleOverlayClick}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all cursor-default border border-white/20"
            onClick={handleModalClick}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600">Please sign in to view your generation history</p>
            </div>
            <LoginForm />
            <p className="text-center text-xs text-gray-400 mt-4">Click outside to go back</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => void fetchRecords()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show main content for authenticated users
  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <GenerationHistory
            generations={generations}
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            loading={loading}
            selectedStatus={selectedStatus}
            startDate={startDate}
            endDate={endDate}
            onClearAll={handleClearAll}
            onDeleteGeneration={handleDeleteGeneration}
            onDownloadGeneration={handleDownloadGeneration}
            onPageChange={handlePageChange}
            onStatusChange={handleStatusChange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </>
  );
}
