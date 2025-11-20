import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 *
 * 拦截所有请求，提取 Firebase token 并添加到 header
 * Server Actions 可以通过 headers() 读取 Authorization header
 */
export function middleware(request: NextRequest) {
  // 1. 从 cookie 中读取 Firebase token（由客户端设置）
  const firebaseToken = request.cookies.get('firebase-token')?.value;

  // 2. 从 cookie 中读取设备指纹
  const deviceFingerprint = request.cookies.get('device-fingerprint')?.value;

  console.log('🔧 [Middleware] Path:', request.nextUrl.pathname);
  console.log('🔧 [Middleware] Firebase token exists:', !!firebaseToken);
  console.log('🔧 [Middleware] Firebase token preview:', firebaseToken?.substring(0, 20) + '...');
  console.log('🔧 [Middleware] Device fingerprint:', deviceFingerprint?.substring(0, 16) + '...');

  // 3. 创建新的 headers 对象,添加认证信息
  const requestHeaders = new Headers(request.headers);

  if (firebaseToken) {
    requestHeaders.set('authorization', `Bearer ${firebaseToken}`);
    console.log('✅ [Middleware] Authorization header 已设置');
  } else {
    console.log('⚠️ [Middleware] 没有找到 firebase-token cookie');
  }

  if (deviceFingerprint) {
    requestHeaders.set('x-device-fingerprint', deviceFingerprint);
    console.log('✅ [Middleware] Device fingerprint header 已设置');
  }

  // 4. 返回带有修改后 headers 的响应
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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