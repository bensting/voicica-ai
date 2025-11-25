'use client';

export function CreditHistorySkeleton() {
  return (
    <div className="h-full flex flex-col gap-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-100 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="flex items-center gap-2">
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                  <div className="h-5 bg-gray-100 rounded-full w-20"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 shrink-0"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}