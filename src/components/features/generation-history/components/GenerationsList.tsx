import SpeechEntry from '../SpeechEntry';
import { Trash2 } from 'lucide-react';
import type { Generation } from '@/types/tts';

interface GenerationsListProps {
  generations: Generation[];
  total: number;
  loading: boolean;
  onClearAll: () => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  title: string;
  clearAllLabel: string;
  noGenerationsTitle: string;
  noGenerationsDescription: string;
}

/**
 * Generations list component
 * Displays the list of speech generations with actions
 */
export default function GenerationsList({
  generations,
  total,
  loading,
  onClearAll,
  onDelete,
  onDownload,
  title,
  clearAllLabel,
  noGenerationsTitle,
  noGenerationsDescription,
}: GenerationsListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Section Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white text-sm font-medium rounded-full">
            {total}
          </div>
        </div>

        {total > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {clearAllLabel}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Speech Entries */}
          <div className="divide-y divide-gray-200">
            {generations.length === 0 ? (
              <EmptyState title={noGenerationsTitle} description={noGenerationsDescription} />
            ) : (
              generations.map((generation) => (
                <SpeechEntry
                  key={generation.id}
                  generation={generation}
                  onDelete={() => onDelete(generation.id)}
                  onDownload={() => onDownload(generation.id)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}