/**
 * Tool Empty State Component
 *
 * 工具页面的空状态组件（公共组件）
 * 支持自定义图标、标题和描述
 */

import React from 'react';

interface ToolEmptyStateProps {
  /** 图标组件 */
  icon: React.ReactNode;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 主题色（用于图标背景渐变） */
  colorFrom?: string;
  colorTo?: string;
  /** 图标颜色 */
  iconColor?: string;
  /** 卡片背景色（移动端） */
  bgColor?: string;
  /** 变体 */
  variant?: 'mobile' | 'desktop';
}

// 信息提示图标
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

export default function ToolEmptyState({
  icon,
  title,
  description,
  colorFrom = 'from-purple-100',
  colorTo = 'to-purple-50',
  iconColor = 'text-purple-600',
  bgColor = 'bg-gray-50/80',
  variant = 'mobile',
}: ToolEmptyStateProps) {
  if (variant === 'mobile') {
    return (
      <div className={`${bgColor} rounded-2xl border border-gray-100 p-5`}>
        {/* 标题和图标在一行 */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>

        {/* 描述（带提示图标） */}
        <div className="flex items-start gap-2 pl-1">
          <InfoIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-2xl mx-auto">
      {/* 标题和图标在一行 */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
      </div>

      {/* 描述（带提示图标） */}
      <div className="flex items-start gap-2.5 max-w-xl">
        <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-gray-500 text-base leading-relaxed text-left">{description}</p>
      </div>
    </div>
  );
}