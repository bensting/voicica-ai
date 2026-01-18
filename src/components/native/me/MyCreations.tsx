'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabType = 'videos' | 'music' | 'cover' | 'images';

const tabs: { id: TabType; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'music', label: 'Music' },
  { id: 'cover', label: 'Cover' },
  { id: 'images', label: 'Images' },
];

const emptyStateMessages: Record<TabType, { title: string; subtitle: string; createLink: string }> = {
  videos: {
    title: 'No content yet.',
    subtitle: 'Create your first AI video work.',
    createLink: '/native/create/video',
  },
  music: {
    title: 'No content yet.',
    subtitle: 'Create your first AI music.',
    createLink: '/native/create/music',
  },
  cover: {
    title: 'No content yet.',
    subtitle: 'Create your first cover.',
    createLink: '/native/create/effect',
  },
  images: {
    title: 'No content yet.',
    subtitle: 'Create your first AI image.',
    createLink: '/native/create/image',
  },
};

// 空状态插画
const EmptyIllustration = () => (
  <svg
    className="w-32 h-32 text-gray-600"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    {/* 文件夹 */}
    <rect x="25" y="40" width="50" height="45" rx="4" />
    <path d="M25 50 L25 45 Q25 40 30 40 L45 40 L50 35 L70 35 Q75 35 75 40 L75 50" />
    {/* 加号 */}
    <line x1="50" y1="55" x2="50" y2="75" strokeWidth="2" />
    <line x1="40" y1="65" x2="60" y2="65" strokeWidth="2" />
    {/* 人物 */}
    <circle cx="90" cy="55" r="8" />
    <path d="M82 75 Q82 65 90 65 Q98 65 98 75" />
    <path d="M85 72 L80 85" />
    <path d="M95 68 L105 60" />
  </svg>
);

interface MyCreationsProps {
  // 后续可以传入实际的作品数据
  creations?: Record<TabType, unknown[]>;
}

/**
 * My Creations 区域
 * 显示用户创建的内容，支持 Tab 切换
 */
export default function MyCreations({ creations }: MyCreationsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('videos');

  const currentCreations = creations?.[activeTab] || [];
  const isEmpty = currentCreations.length === 0;
  const emptyState = emptyStateMessages[activeTab];

  return (
    <div className="px-4 pt-6 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-4">My Creations</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {isEmpty ? (
        // 空状态
        <div className="flex flex-col items-center justify-center py-12">
          <EmptyIllustration />
          <p className="mt-4 text-gray-400 text-center">
            {emptyState.title}
          </p>
          <p className="text-gray-500 text-sm text-center">
            {emptyState.subtitle}
          </p>
          <Link
            href={emptyState.createLink}
            className="mt-6 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
          >
            Go create
          </Link>
        </div>
      ) : (
        // 作品列表（后续实现）
        <div className="grid grid-cols-2 gap-3">
          {/* 作品卡片 */}
        </div>
      )}
    </div>
  );
}
