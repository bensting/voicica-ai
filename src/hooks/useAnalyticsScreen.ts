/**
 * Analytics Screen Tracking Hook
 *
 * 自动追踪页面浏览
 * 在页面组件中使用此 hook，会在组件挂载时记录页面浏览
 */
import { useEffect } from 'react';
import { logScreenView } from '@/lib/native-analytics';

/**
 * 追踪页面浏览
 * @param screenName 页面名称
 * @param screenClass 页面类名（可选）
 */
export function useAnalyticsScreen(screenName: string, screenClass?: string): void {
  useEffect(() => {
    logScreenView(screenName, screenClass);
  }, [screenName, screenClass]);
}
