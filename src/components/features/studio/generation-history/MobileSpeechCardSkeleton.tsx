export default function MobileSpeechCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Text Content Skeleton */}
      <div className="mb-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>

      {/* Audio Player Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0"></div>
      </div>
    </div>
  );
}