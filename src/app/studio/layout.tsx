'use client';

import { useRouter } from 'next/navigation';
import StudioSidebar from '@/components/features/studio/StudioSidebar';
import StudioToolbar from '@/components/features/studio/StudioToolbar';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useLanguage } from '@/contexts/LanguageContext';

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { title } = useStudio();
  const { credits, loading: creditsLoading } = useUserCredits();

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Studio Toolbar - 固定在最顶部，横跨整个页面，无边距 */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>

            {/* Right: Credits + Upgrade */}
            <div className="flex items-center gap-4">
              {/* Credits Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {creditsLoading ? (
                  <div className="w-12 h-4 bg-blue-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-semibold text-blue-900">{credits}</span>
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Upgrade Button */}
              <button
                onClick={handleUpgradeClick}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm">{t('studio.upgrade') || '购买/升级'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 下方内容区域：侧边栏 + 主内容 */}
      <div className="pt-[124px]">
        {/* 桌面端侧边栏 */}
        <div className="hidden lg:block">
          <StudioSidebar variant="desktop" />
        </div>

        {/* 移动端水平菜单 */}
        <div className="lg:hidden fixed top-[124px] left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-40 overflow-x-auto">
          <StudioSidebar variant="mobile" />
        </div>

        {/* 主内容区域 */}
        <main className="lg:ml-16">
          {/* 移动端需要额外的顶部间距（菜单高度） */}
          <div className="lg:hidden h-16"></div>

          {/* 页面内容 */}
          <div className="transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioProvider>
      <StudioLayoutContent>{children}</StudioLayoutContent>
    </StudioProvider>
  );
}