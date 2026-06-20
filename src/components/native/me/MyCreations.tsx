'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getAvailableMyCreationsTabs,
  getDefaultMyCreationsTab,
  isValidMyCreationsTab,
  type MyCreationsTabId,
} from '@/config/native/myCreationsTabsConfig';
import { getFeatureFlags, type FeatureFlags } from '@/actions/admin/system-config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';

import { VoicesTab, MusicTab, DialogueTab, ImageTab, VideoTab } from './tabs';

/**
 * My Creations 区域
 * 显示用户创建的内容，支持 Tab 切换和下拉刷新
 */
export default function MyCreations({ isActive }: { isActive?: boolean }) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // 获取可用的标签配置（由 DB feature flags 动态过滤）
  const [availableTabs, setAvailableTabs] = useState(() => getAvailableMyCreationsTabs());
  const defaultTab = useMemo(() => getDefaultMyCreationsTab(), []);

  useEffect(() => {
    getFeatureFlags().then((flags: FeatureFlags) => {
      const tabFlagMap: Record<string, keyof FeatureFlags> = {
        voices: 'voice',
        dialogues: 'dialogue',
        image: 'image',
        music: 'music',
        video: 'video',
      };
      setAvailableTabs(getAvailableMyCreationsTabs().filter(tab => flags[tabFlagMap[tab.id]] !== false));
    });
  }, []);

  // 从 URL 参数获取初始 tab
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && isValidMyCreationsTab(tabFromUrl)
    ? tabFromUrl
    : defaultTab;

  const [activeTab, setActiveTab] = useState<MyCreationsTabId>(initialTab);

  // 同步 URL 参数到 activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && isValidMyCreationsTab(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 插页式广告（非订阅用户打开 DetailModal 时）
  const { showInterstitialAd } = useInterstitialAd();
  const { isSubscribed } = useSubscription();
  const lastDetailAdTimeRef = useRef<number>(0);

  const handleDetailOpen = useCallback(() => {
    if (isSubscribed) return;
    const now = Date.now();
    if (now - lastDetailAdTimeRef.current < 30 * 60 * 1000) return;
    lastDetailAdTimeRef.current = Date.now();
    setTimeout(() => showInterstitialAd(), 500);
  }, [isSubscribed, showInterstitialAd]);

  // 下拉刷新
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const PULL_THRESHOLD = 60;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || scrollRef.current?.scrollTop !== 0) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setRefreshTrigger((n) => n + 1);
      // 模拟刷新结束
      setTimeout(() => setRefreshing(false), 1000);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // Tab 标签翻译
  const tabLabelKey: Record<MyCreationsTabId, string> = {
    voices: 'native.me.tabs.voices',
    dialogues: 'native.me.tabs.dialogues',
    music: 'native.me.tabs.music',
    video: 'native.me.tabs.video',
    image: 'native.me.tabs.image',
  };

  const tabProps = {
    refreshTrigger,
    onDetailOpen: handleDetailOpen,
  };

  return (
    <div className="h-full flex flex-col">
      {/* 固定的标题和 Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 bg-[#0a0a1a]">
        <h2 className="text-xl font-bold text-white mb-3">{t('native.me.myCreations')}</h2>

        <div className="flex gap-4 border-b border-gray-800 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t(tabLabelKey[tab.id])}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: pullDistance > 0 ? pullDistance : 16 }}
      >
        {/* 下拉刷新指示器 */}
        {(pullDistance > 0 || refreshing) && (
          <div className="flex justify-center py-2 -mt-2 mb-2">
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`text-gray-400 text-xs transition-opacity ${pullDistance >= PULL_THRESHOLD ? 'opacity-100' : 'opacity-50'}`}>
                {pullDistance >= PULL_THRESHOLD ? t('native.me.releaseToRefresh') : t('native.me.pullToRefresh')}
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <>
          {activeTab === 'voices' && <VoicesTab isActive={!!isActive} {...tabProps} />}
          {activeTab === 'music' && <MusicTab isActive={!!isActive} {...tabProps} />}
          {activeTab === 'dialogues' && <DialogueTab isActive={!!isActive} {...tabProps} />}
          {activeTab === 'image' && <ImageTab isActive={!!isActive} {...tabProps} />}
          {activeTab === 'video' && <VideoTab isActive={!!isActive} {...tabProps} />}
        </>
      </div>
    </div>
  );
}
