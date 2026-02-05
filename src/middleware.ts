import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 支持的语言列表
const SUPPORTED_LOCALES = ['en-US', 'zh-CN', 'zh-TW', 'th-TH'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en-US';

/**
 * 从 Accept-Language header 检测用户语言
 */
function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // 解析 Accept-Language header (如: "zh-CN,zh;q=0.9,en;q=0.8")
  const languages = acceptLanguage.split(',').map((lang) => {
    const [code, qValue] = lang.trim().split(';q=');
    return { code: code.toLowerCase(), q: qValue ? parseFloat(qValue) : 1 };
  });

  // 按优先级排序
  languages.sort((a, b) => b.q - a.q);

  // 匹配支持的语言
  for (const { code } of languages) {
    if (code.startsWith('zh')) {
      if (code.includes('tw') || code.includes('hk') || code.includes('hant')) {
        return 'zh-TW';
      }
      return 'zh-CN';
    }
    if (code.startsWith('th')) {
      return 'th-TH';
    }
    if (code.startsWith('en')) {
      return 'en-US';
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Next.js Middleware
 *
 * 功能：
 * 1. 语言检测：从 cookie 或 Accept-Language header 检测用户语言
 * 2. 认证：提取 Firebase token 并添加到 header
 */
export function middleware(request: NextRequest) {
  // ========== 语言检测 ==========
  let locale = request.cookies.get('locale')?.value as Locale | undefined;
  let shouldSetLocaleCookie = false;

  // 如果没有保存的语言偏好，从 Accept-Language 检测
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    const acceptLanguage = request.headers.get('accept-language');
    locale = detectLocaleFromHeader(acceptLanguage);
    shouldSetLocaleCookie = true; // 首次访问，需要设置 cookie
  }

  // ========== 认证处理 ==========
  const firebaseToken = request.cookies.get('firebase-token')?.value;
  const deviceFingerprint = request.cookies.get('device-fingerprint')?.value;
  const platform = request.cookies.get('platform')?.value;

  // 创建新的 headers 对象
  const requestHeaders = new Headers(request.headers);

  // 添加语言到 header（供 SSR 使用）
  requestHeaders.set('x-locale', locale);

  if (firebaseToken) {
    requestHeaders.set('authorization', `Bearer ${firebaseToken}`);
  }

  if (deviceFingerprint) {
    requestHeaders.set('x-device-fingerprint', deviceFingerprint);
  }

  if (platform) {
    requestHeaders.set('x-platform', platform);
  }

  // 创建响应
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 首次访问时设置语言 cookie（1年有效期）
  if (shouldSetLocaleCookie) {
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}

// 配置 middleware 匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};