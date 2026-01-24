'use client';

import Link from 'next/link';
import { getEnabledFeatures } from '@/config/studioFeatures';

/**
 * Studio 功能入口网格
 * 横向滚动显示功能入口卡片
 */
export default function StudioFeatureGrid() {
  const features = getEnabledFeatures();

  return (
    <div className="py-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="flex flex-col items-center justify-center w-[100px] lg:w-[110px] aspect-square flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
              {feature.icon}
            </div>
            <span className="text-[11px] text-gray-600 font-medium text-center px-2 leading-tight line-clamp-2">
              {feature.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
