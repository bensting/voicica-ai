'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageLoading from '@/components/ui/PageLoading';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on client-side only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 1023px)').matches);
    };
    checkMobile();

    // Optional: listen for resize
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
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
  } = useGenerationHistory({
    user,
    authLoading,
    accumulateData: isMobile // Enable infinite scroll on mobile
  });

  // Show loading while checking auth (optional, can be removed if not needed)
  // Note: Anonymous users can also view their generation history
  if (authLoading) {
    return <PageLoading show={true} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 pt-[60px] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
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
        // Mobile Layout - Fixed viewport with internal scrolling
        <div className="fixed inset-0 bg-gray-50 pt-16 overflow-hidden">
          <MobileView {...viewProps} />
        </div>
      ) : (
        // Desktop Layout - Fixed viewport with internal scrolling (like TTS page)
        <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-white pt-[60px] overflow-hidden">
          <div className="h-full max-w-6xl mx-auto px-4 py-6 overflow-hidden">
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