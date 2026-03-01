'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserLuckyDrawHistory } from '@/actions/lucky-draw';
import {
  getAvailableMyCreationsTabs,
  getDefaultMyCreationsTab,
  isValidMyCreationsTab,
  type MyCreationsTabId,
} from '@/config/native/myCreationsTabsConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';

import LuckyDrawTab from './LuckyDrawTab';
import { VoicesTab, MusicTab, DialogueTab, ImageTab, VideoTab, CoverTab } from './tabs';

/**
 * My Creations 区域
 * 显示用户创建的内容，支持 Tab 切换和下拉刷新
 */
export default function MyCreations({ isActive }: { isActive?: boolean }) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // 获取可用的标签配置
  const availableTabs = useMemo(() => getAvailableMyCreationsTabs(), []);
  const defaultTab = useMemo(() => getDefaultMyCreationsTab(), []);

  // 从 URL 参数获取初始 tab
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && isValidMyCreationsTab(tabFromUrl)
    ? tabFromUrl
    : defaultTab;

  // 顶级区域切换: 'creations' | 'lucky-draws'
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<'creations' | 'lucky-draws'>(
    sectionFromUrl === 'lucky-draws' ? 'lucky-draws' : 'creations'
  );
  const [activeDrawCount, setActiveDrawCount] = useState(0);
  const [wonDrawCount, setWonDrawCount] = useState(0);
  const [drawFilter, setDrawFilter] = useState<'all' | 'won'>('all');

  // 延迟加载：仅在首次 active 时获取抽奖数据
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!isActive || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    getUserLuckyDrawHistory()
      .then((records) => {
        const active = records.filter((r) => r.status === 'selling' || r.status === 'drawing');
        setActiveDrawCount(active.length);
        const won = records.filter((r) => r.status === 'completed' && r.result?.won);
        setWonDrawCount(won.length);
      })
      .catch(() => {});
  }, [isActive]);

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
    cover: 'native.me.tabs.cover',
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
        {/* 顶级区域切换 */}
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => setActiveSection('creations')}
            className={`text-xl font-bold transition-colors ${
              activeSection === 'creations' ? 'text-white' : 'text-gray-600'
            }`}
          >
            {t('native.me.myCreations')}
          </button>
          <button
            onClick={() => setActiveSection('lucky-draws')}
            className={`text-xl font-bold transition-colors flex items-center gap-1.5 ${
              activeSection === 'lucky-draws' ? 'text-white' : 'text-gray-600'
            }`}
          >
            My Draws
            {activeDrawCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-purple-600 rounded-full">
                {activeDrawCount}
              </span>
            )}
          </button>
        </div>

        {/* Creation Tabs (仅在 creations 模式下显示) */}
        {activeSection === 'creations' && (
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
        )}

        {/* Draw Filter Tabs (仅在 lucky-draws 模式下显示) */}
        {activeSection === 'lucky-draws' && (
          <div className="flex items-center justify-center gap-1 pb-2">
            {(['all', 'won'] as const).map((tab) => {
              const active = drawFilter === tab;
              const label = tab === 'all' ? 'All' : `Won${wonDrawCount > 0 ? ` (${wonDrawCount})` : ''}`;
              return (
                <button
                  key={tab}
                  onClick={() => setDrawFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
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
        {activeSection === 'lucky-draws' ? (
          <LuckyDrawTab filter={drawFilter} />
        ) : (
          <>
            {activeTab === 'voices' && <VoicesTab isActive={!!isActive} {...tabProps} />}
            {activeTab === 'music' && <MusicTab isActive={!!isActive} {...tabProps} />}
            {activeTab === 'dialogues' && <DialogueTab isActive={!!isActive} {...tabProps} />}
            {activeTab === 'image' && <ImageTab isActive={!!isActive} {...tabProps} />}
            {activeTab === 'video' && <VideoTab isActive={!!isActive} {...tabProps} />}
            {activeTab === 'cover' && <CoverTab isActive={!!isActive} {...tabProps} />}
          </>
        )}
      </div>
    </div>
  );
}
