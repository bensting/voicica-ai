'use client';

import type { ImageRecord } from '@/actions/image';

interface ImageCardProps {
  image: ImageRecord;
  onClick: () => void;
}

// 状态图标
const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'PENDING' || status === 'PROCESSING') {
    return (
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    );
  }
  return null;
};

/**
 * 图片卡片组件
 */
export default function ImageCard({ image, onClick }: ImageCardProps) {
  const isProcessing = image.status === 'PENDING' || image.status === 'PROCESSING';
  const isSuccess = image.status === 'SUCCESS';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isSuccess ? 'bg-gray-800/40 hover:bg-gray-800/60 cursor-pointer' : 'bg-gray-800/30'
      }`}
    >
      {/* 缩略图 */}
      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
        {image.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.image_url}
            alt={image.prompt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            {isProcessing ? (
              <StatusIcon status={image.status} />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{image.model}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500">{image.aspect_ratio}</span>
          {image.quality && (
            <>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-500">{image.quality}</span>
            </>
          )}
        </div>
      </div>

      {/* 状态指示 */}
      {isProcessing && (
        <div className="flex-shrink-0">
          <StatusIcon status={image.status} />
        </div>
      )}
    </div>
  );
}
