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
  /** 变体 */
  variant?: 'mobile' | 'desktop';
}

export default function ToolEmptyState({
  icon,
  title,
  description,
  colorFrom = 'from-purple-100',
  colorTo = 'to-purple-50',
  iconColor = 'text-purple-600',
  variant = 'mobile',
}: ToolEmptyStateProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        {/* 标题和图标在一行 */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* 描述 */}
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">{description}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      {/* 标题和图标在一行 */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
      </div>

      {/* 描述 */}
      <p className="text-gray-500 text-base max-w-md leading-relaxed">{description}</p>
    </div>
  );
}