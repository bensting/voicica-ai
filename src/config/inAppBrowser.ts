/**
 * 应用内浏览器检测配置
 *
 * 用于检测会阻止 OAuth 登录的应用内浏览器（WebView）
 * Google 等 OAuth 提供商禁止在 WebView 中进行登录
 *
 * 添加新应用：在 IN_APP_BROWSER_PATTERNS 中添加对应的 User Agent 关键词
 */

export interface InAppBrowserPattern {
  /** 应用名称（用于日志） */
  name: string;
  /** User Agent 中的关键词（小写） */
  pattern: string;
  /** 是否支持 openExternalBrowser 参数 */
  supportsExternalBrowserParam?: boolean;
}

/**
 * 已知会阻止 OAuth 登录的应用内浏览器
 *
 * 注意：只添加真正会阻止登录的应用
 * 如果某个应用能正常登录（如 Telegram），则不需要添加
 */
export const IN_APP_BROWSER_PATTERNS: InAppBrowserPattern[] = [
  {
    name: 'LINE',
    pattern: 'line',
    supportsExternalBrowserParam: true, // LINE 支持 ?openExternalBrowser=1
  },
  {
    name: '微信',
    pattern: 'micromessenger',
    supportsExternalBrowserParam: false,
  },
  {
    name: '微信',
    pattern: 'wechat',
    supportsExternalBrowserParam: false,
  },
  {
    name: 'Facebook',
    pattern: 'fban',
    supportsExternalBrowserParam: false,
  },
  {
    name: 'Facebook',
    pattern: 'fbav',
    supportsExternalBrowserParam: false,
  },
  {
    name: 'Instagram',
    pattern: 'instagram',
    supportsExternalBrowserParam: false,
  },
  // ============================================
  // 以下应用已测试可正常登录，暂不需要检测
  // 如果将来出现问题，取消注释即可启用
  // ============================================
  // {
  //   name: 'Telegram',
  //   pattern: 'telegram',
  //   supportsExternalBrowserParam: false,
  // },
  // {
  //   name: 'TikTok',
  //   pattern: 'bytedance',
  //   supportsExternalBrowserParam: false,
  // },
  // {
  //   name: 'TikTok',
  //   pattern: 'tiktok',
  //   supportsExternalBrowserParam: false,
  // },
  // {
  //   name: 'Snapchat',
  //   pattern: 'snapchat',
  //   supportsExternalBrowserParam: false,
  // },
];

/**
 * 检测是否在 Capacitor 原生应用中
 *
 * 远程加载模式下 window.Capacitor 不可用，需要通过 User-Agent 检测
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;

  // 方法 1: 检测 Capacitor 对象（本地模式有效）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Capacitor = (window as any).Capacitor;
  if (Capacitor?.isNativePlatform?.() === true) {
    return true;
  }

  // 方法 2: 通过 User-Agent 检测（远程加载模式）
  // Capacitor 配置了 appendUserAgent: 'VoicicaApp'
  const ua = navigator.userAgent;
  if (ua.includes('VoicicaApp')) {
    return true;
  }

  return false;
}

/**
 * 检测是否在应用内浏览器中
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  // Capacitor 原生应用视为应用内浏览器（需要使用 redirect 方式登录）
  if (isCapacitorNative()) return true;

  const ua = navigator.userAgent.toLowerCase();

  // 检查是否匹配已知的应用内浏览器
  const matched = IN_APP_BROWSER_PATTERNS.some((app) => ua.includes(app.pattern));
  if (matched) return true;

  // 通用检测：移动端 WebView（非 Safari、非 Chrome）
  const isGenericWebView =
    ua.includes('mobile') &&
    !ua.includes('safari') &&
    ua.includes('applewebkit') &&
    !ua.includes('chrome');

  return isGenericWebView;
}

/**
 * 获取当前应用内浏览器的信息
 */
export function getInAppBrowserInfo(): InAppBrowserPattern | null {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent.toLowerCase();

  for (const app of IN_APP_BROWSER_PATTERNS) {
    if (ua.includes(app.pattern)) {
      return app;
    }
  }

  return null;
}

/**
 * 尝试在外部浏览器中打开当前页面
 */
export function openInExternalBrowser(): void {
  if (typeof window === 'undefined') return;

  const currentUrl = window.location.href;
  const ua = navigator.userAgent.toLowerCase();
  const appInfo = getInAppBrowserInfo();

  // LINE 浏览器 - 使用特殊参数
  if (appInfo?.supportsExternalBrowserParam || ua.includes('line')) {
    const separator = currentUrl.includes('?') ? '&' : '?';
    window.location.href = `${currentUrl}${separator}openExternalBrowser=1`;
    return;
  }

  // Android - 尝试使用 Intent scheme
  if (/android/i.test(ua)) {
    const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`;
    window.location.href = intentUrl;
    return;
  }

  // iOS 或其他 - 尝试 window.open
  window.open(currentUrl, '_system');
}