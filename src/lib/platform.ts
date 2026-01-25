/**
 * 平台检测工具
 *
 * 用于识别用户访问来源：web, mobile-web, android, ios
 */

export type Platform = 'web' | 'mobile-web' | 'android' | 'ios';

/**
 * 检测当前平台
 *
 * 检测优先级：
 * 1. 原生应用标识（window.nativeApp 或特殊 User-Agent）
 * 2. 移动端浏览器
 * 3. 桌面浏览器
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'web'; // SSR 环境默认返回 web
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // 1. 检测原生应用（通过自定义标识）
  // Android WebView 会注入 window.Android 或 window.nativeApp
  // iOS WKWebView 会注入 window.webkit.messageHandlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  // 检测 Android 原生应用
  if (
    win.Android ||
    win.nativeApp?.platform === 'android' ||
    userAgent.includes('voicicaapp/android')
  ) {
    return 'android';
  }

  // 检测 iOS 原生应用
  if (
    win.webkit?.messageHandlers?.nativeApp ||
    win.nativeApp?.platform === 'ios' ||
    userAgent.includes('voicicaapp/ios')
  ) {
    return 'ios';
  }

  // 2. 检测移动端浏览器
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    ) ||
    // 检测触摸设备 + 小屏幕
    ('ontouchstart' in window && window.innerWidth < 768);

  if (isMobile) {
    return 'mobile-web';
  }

  // 3. 默认桌面浏览器
  return 'web';
}

/**
 * 平台显示名称
 */
export const PLATFORM_LABELS: Record<Platform, string> = {
  web: 'Web',
  'mobile-web': 'Mobile Web',
  android: 'Android',
  ios: 'iOS',
};

/**
 * 平台图标（用于管理后台显示）
 */
export const PLATFORM_ICONS: Record<Platform, string> = {
  web: '🖥️',
  'mobile-web': '📱',
  android: '🤖',
  ios: '🍎',
};
