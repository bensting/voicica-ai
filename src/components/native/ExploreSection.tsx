'use client';

import { useState } from 'react';

// Tab 类型
type TabType = 'music' | 'voices';

const tabs: { id: TabType; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'voices', label: 'Voices' },
];

/**
 * Explore 区域
 * 包含 Music / Voices 两个 Tab
 */
export default function ExploreSection() {
  const [activeTab, setActiveTab] = useState<TabType>('music');

  return (
    <div className="px-4 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-4">Explore</h2>

      {/* Tabs */}
      <div className="flex gap-6 mb-4 border-b border-gray-800">
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
      <div className="text-center py-12 text-gray-500">
        Coming soon...
      </div>
    </div>
  );
}
