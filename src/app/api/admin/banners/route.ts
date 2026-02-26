/**
 * Admin Banners API
 *
 * GET /api/admin/banners - 获取所有 Banner（含未启用）
 * POST /api/admin/banners - 创建新 Banner
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { nativeBanners } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/auth-admin';

// 获取所有 Banner
export async function GET() {
  const db = await getDb();
  try {
    await verifyAdmin();

    const banners = await db.select().from(nativeBanners)
      .orderBy(asc(nativeBanners.sortOrder), desc(nativeBanners.createdAt));

    return NextResponse.json({
      success: true,
      banners: banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        titles: b.titles,
        subtitles: b.subtitles,
        buttonTexts: b.buttonTexts,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error) {
    console.error('❌ [Admin] 获取 Banner 列表失败:', error);

    const message = error instanceof Error ? error.message : 'Failed to get banners';
    const status = message === '无权限访问' || message === '未登录' ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// 创建新 Banner
export async function POST(request: NextRequest) {
  const db = await getDb();
  try {
    await verifyAdmin();

    const body = await request.json();
    const { imageUrl, linkUrl, titles, subtitles, buttonTexts, sortOrder, isActive } = body;

    // 验证必填字段
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '图片 URL 不能为空' },
        { status: 400 }
      );
    }

    if (!titles || typeof titles !== 'object') {
      return NextResponse.json(
        { success: false, error: '标题不能为空' },
        { status: 400 }
      );
    }

    if (!subtitles || typeof subtitles !== 'object') {
      return NextResponse.json(
        { success: false, error: '副标题不能为空' },
        { status: 400 }
      );
    }

    const [banner] = await db.insert(nativeBanners).values({
      imageUrl,
      linkUrl: linkUrl || null,
      titles: titles,
      subtitles: subtitles,
      buttonTexts: buttonTexts || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json({
      success: true,
      banner: {
        id: banner.id,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        titles: banner.titles,
        subtitles: banner.subtitles,
        buttonTexts: banner.buttonTexts,
        sortOrder: banner.sortOrder,
        isActive: banner.isActive,
        createdAt: banner.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [Admin] 创建 Banner 失败:', error);

    const message = error instanceof Error ? error.message : 'Failed to create banner';
    const status = message === '无权限访问' || message === '未登录' ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
