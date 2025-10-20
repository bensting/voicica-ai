'use client';

interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  saveText: string;
  cancelText: string;
  isLoading?: boolean;
}

export default function ActionButtons({
  onSave,
  onCancel,
  saveText,
  cancelText,
  isLoading = false
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Saving...' : saveText}
      </button>
    </div>
  );
}
