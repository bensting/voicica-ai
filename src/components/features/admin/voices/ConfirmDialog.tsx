'use client';

import { ConfirmDialogState } from './types';

interface ConfirmDialogProps {
  dialog: ConfirmDialogState;
  onClose: () => void;
}

/**
 * 确认对话框组件
 */
export default function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  if (!dialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {dialog.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {dialog.message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={dialog.onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            确定清空
          </button>
        </div>
      </div>
    </div>
  );
}
