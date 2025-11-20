import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 *
 * 拦截所有请求，提取 Firebase token 并添加到 header
 * Server Actions 可以通过 headers() 读取 Authorization header
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. 从 cookie 中读取 Firebase token（由客户端设置）
  const firebaseToken = request.cookies.get('firebase-token')?.value;

  if (firebaseToken) {
    // 2. 添加到 request headers，供 Server Actions 使用
    response.headers.set('authorization', `Bearer ${firebaseToken}`);
  }

  // 3. 传递设备指纹（用于匿名用户）
  const deviceFingerprint = request.cookies.get('device-fingerprint')?.value;
  if (deviceFingerprint) {
    response.headers.set('x-device-fingerprint', deviceFingerprint);
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