'use client';

interface FileCardProps {
  fileName: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onDelete: () => void;
}

/**
 * File Card Component
 *
 * Displays uploaded file with play and delete actions
 */
export default function FileCard({ fileName, isPlaying = false, onPlay, onDelete }: FileCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* File Icon */}
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
          </svg>
        </div>

        {/* File Name */}
        <span className="text-sm font-medium text-gray-900 truncate">
          {fileName}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-3">
        {/* Play/Pause Button */}
        {onPlay && (
          <button
            onClick={onPlay}
            className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
          >
            {isPlaying ? (
              // Pause Icon
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            ) : (
              // Play Icon
              <svg
                className="w-4 h-4 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>
        )}

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500 hover:text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}