'use client';

import { useEffect, useState } from 'react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  /** 确认提示文字，如 "Confirm delete song?" */
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * 删除确认弹窗组件 (Native App 深色主题)
 *
 * @example
 * ```tsx
 * <DeleteConfirmDialog
 *   isOpen={showDeleteDialog}
 *   title="Confirm delete song?"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteDialog(false)}
 * />
 * ```
 */
export default function DeleteConfirmDialog({
  isOpen,
  title = 'Confirm delete?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-3xl shadow-2xl max-w-sm w-full mx-6 overflow-hidden"
        onClick={handleDialogClick}
        style={{
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-white text-lg font-medium text-center">
            {title}
          </p>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 py-3.5 text-white font-semibold rounded-full bg-[#3a3a5a] hover:bg-[#4a4a6a] transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-3.5 text-white font-semibold rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-90 cursor-wait' : ''
            }`}
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Deleting...' : confirmLabel}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
