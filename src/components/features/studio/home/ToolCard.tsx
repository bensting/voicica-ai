'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

/**
 * 工具卡片组件
 *
 * 水平布局：图标在左，标题和描述在右
 * 用于展示小工具如下载器等
 */
export default function ToolCard({
  title,
  description,
  href,
  icon,
  iconBgColor = 'bg-purple-100',
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 p-4 bg-white"
    >
      {/* 图标 */}
      <div
        className={`flex-shrink-0 w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{description}</p>
      </div>

      {/* 箭头 */}
      <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}