import { NextRequest, NextResponse } from 'next/server';

/**
 * 设置 Firebase Token Cookie
 *
 * 通过 API 路由设置 HttpOnly cookie，比客户端 document.cookie 更安全可靠
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // 设置 HttpOnly cookie
    response.cookies.set('firebase-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 小时
    });

    return response;
  } catch (error) {
    console.error('❌ [API] 设置 token cookie 失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 清除 Firebase Token Cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('firebase-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
