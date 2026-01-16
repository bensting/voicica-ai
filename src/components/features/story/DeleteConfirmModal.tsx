'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import type { UserStory } from '@/actions/story';

interface DeleteConfirmModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  t: (key: string) => string;
}

export default function DeleteConfirmModal({
  story,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  t,
}: DeleteConfirmModalProps) {
  if (!isOpen || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Icon */}
        <div className="pt-6 flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('story.deleteConfirmTitle') || 'Delete Story'}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            {t('story.deleteConfirmMessage') || 'Are you sure you want to delete this story?'}
          </p>
          <p className="text-sm font-medium text-gray-800 truncate">
            &quot;{story.title}&quot;
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('story.deleteWarning') || 'This action cannot be undone.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.deleting') || 'Deleting...'}
              </>
            ) : (
              t('common.delete') || 'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}