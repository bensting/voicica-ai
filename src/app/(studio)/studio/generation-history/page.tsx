'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DesktopView from '@/components/features/studio/generation-history/DesktopView';
import MobileView from '@/components/features/studio/generation-history/MobileView';
import { useGenerationHistory } from '@/components/features/studio/generation-history/hooks/useGenerationHistory';

/**
 * Generation History Page
 *
 * Displays user's TTS generation history with filtering and pagination
 * Supports both authenticated and anonymous users
 * Uses CSS media query to determine which view to render (avoids state updates)
 */
export default function GenerationHistoryPage() {
  const { user, loading: authLoading } = useAuth();

  // Use CSS media query to determine if mobile (no state, no re-renders)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  }, []);

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
  } = useGenerationHistory({ user, authLoading });

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

  // Common props for both views
  const viewProps = {
    generations,
    total,
    currentPage,
    pageSize,
    totalPages,
    loading,
    selectedStatus,
    startDate,
    endDate,
    onClearAll: handleClearAll,
    onDeleteGeneration: handleDeleteGeneration,
    onDownloadGeneration: handleDownloadGeneration,
    onPageChange: handlePageChange,
    onStatusChange: handleStatusChange,
    onDateRangeChange: handleDateRangeChange,
  };

  // Show main content (supports both authenticated and anonymous users)
  // Only render ONE view based on screen size (no duplication)
  return (
    <>
      {isMobile ? (
        // Mobile Layout
        <div className="fixed inset-0 bg-gray-50 pt-16 overflow-hidden">
          <div className="h-full px-4">
            <MobileView {...viewProps} />
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="min-h-screen bg-gray-50 pt-20 overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <DesktopView {...viewProps} />
          </div>
        </div>
      )}

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