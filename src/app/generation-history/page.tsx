'use client';

import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GenerationHistory from '@/components/features/generation-history/GenerationHistory';
import { useGenerationHistory } from '@/components/features/generation-history/hooks/useGenerationHistory';

/**
 * Generation History Page
 *
 * Displays user's TTS generation history with filtering and pagination
 * Supports both authenticated and anonymous users
 */
export default function GenerationHistoryPage() {
  const { user, loading: authLoading } = useAuth();

  // Use custom hook for all business logic
  const {
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
    handleClearAll,
    handleDeleteGeneration,
    handleDownloadGeneration,
    handlePageChange,
    handleStatusChange,
    handleDateRangeChange,
    closeConfirmDialog,
    fetchRecords,
  } = useGenerationHistory({ user });

  // Show loading while checking auth (optional, can be removed if not needed)
  // Note: Anonymous users can also view their generation history
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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

  // Show main content (supports both authenticated and anonymous users)
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
        onCancel={closeConfirmDialog}
        variant="danger"
      />
    </>
  );
}
