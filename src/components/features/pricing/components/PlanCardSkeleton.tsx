'use client';

/**
 * 定价卡片骨架屏组件
 * 在加载时显示占位符
 */
export default function PlanCardSkeleton() {
  return (
    <div className="relative rounded-2xl p-6 flex flex-col border-2 border-gray-200 bg-white">
      {/* 折扣标签占位 */}
      <div className="absolute -top-3 left-4">
        <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Plan Name */}
      <div className="mb-4 mt-2">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Price Section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-2" />
      </div>

      {/* Credits Slider */}
      <div className="mb-6">
        <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
        <div className="flex justify-between mt-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* CTA Button */}
      <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse mb-4" />

      {/* Credits Usage Rules */}
      <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}