/**
 * YouTube Video Downloader Empty State Component
 *
 * 空状态提示组件
 */

import YouTubeIcon from '@/components/icons/YouTubeIcon';

interface EmptyStateProps {
  emptyTitle: string;
  emptyDescription: string;
  variant?: 'mobile' | 'desktop';
}

export default function EmptyState({ emptyTitle, emptyDescription, variant = 'mobile' }: EmptyStateProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-4">
          <YouTubeIcon className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
        <p className="text-gray-500 text-sm max-w-xs">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-6">
        <YouTubeIcon className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
      <p className="text-gray-500 max-w-md">{emptyDescription}</p>
    </div>
  );
}