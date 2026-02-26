/**
 * Native App Banners API
 *
 * GET /api/v1/native/banners - 获取启用的 Banner 列表（公开）
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { nativeBanners } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  const db = await getDb();
  try {
    const banners = await db.select()
      .from(nativeBanners)
      .where(eq(nativeBanners.isActive, true))
      .orderBy(asc(nativeBanners.sortOrder));

    const response = NextResponse.json({
      success: true,
      banners: banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        titles: b.titles,
        subtitles: b.subtitles,
        buttonTexts: b.buttonTexts,
      })),
    });

    // Banner 数据变化不频繁，缓存 5 分钟
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

    return response;
  } catch (error) {
    console.error('❌ [Banners] 获取 Banner 列表失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get banners',
      },
      { status: 500 }
    );
  }
}
