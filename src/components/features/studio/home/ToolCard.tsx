'use client';

import Link from 'next/link';

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
 * 竖向布局：图标在上，标题和描述在下
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
      className="group block rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 p-5 bg-white"
    >
      {/* 图标 */}
      <div
        className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center mb-4`}
      >
        {icon}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
        {title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </Link>
  );
}