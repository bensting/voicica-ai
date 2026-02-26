/**
 * Admin Single Banner API
 *
 * PUT /api/admin/banners/[id] - 更新 Banner
 * DELETE /api/admin/banners/[id] - 删除 Banner
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { nativeBanners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/auth-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 更新 Banner
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const db = await getDb();
  try {
    await verifyAdmin();

    const { id } = await params;
    const bannerId = parseInt(id, 10);

    if (isNaN(bannerId)) {
      return NextResponse.json(
        { success: false, error: '无效的 Banner ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { imageUrl, linkUrl, titles, subtitles, buttonTexts, sortOrder, isActive } = body;

    // 检查 Banner 是否存在
    const [existing] = await db.select().from(nativeBanners).where(eq(nativeBanners.id, bannerId)).limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner 不存在' },
        { status: 404 }
      );
    }

    // 更新
    const [banner] = await db.update(nativeBanners).set({
      ...(imageUrl !== undefined && { imageUrl }),
      ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
      ...(titles !== undefined && { titles }),
      ...(subtitles !== undefined && { subtitles }),
      ...(buttonTexts !== undefined && { buttonTexts: buttonTexts || null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    }).where(eq(nativeBanners.id, bannerId)).returning();

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
        updatedAt: banner.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ [Admin] 更新 Banner 失败:', error);

    const message = error instanceof Error ? error.message : 'Failed to update banner';
    const status = message === '无权限访问' || message === '未登录' ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// 删除 Banner
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const db = await getDb();
  try {
    await verifyAdmin();

    const { id } = await params;
    const bannerId = parseInt(id, 10);

    if (isNaN(bannerId)) {
      return NextResponse.json(
        { success: false, error: '无效的 Banner ID' },
        { status: 400 }
      );
    }

    // 检查 Banner 是否存在
    const [existing] = await db.select().from(nativeBanners).where(eq(nativeBanners.id, bannerId)).limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner 不存在' },
        { status: 404 }
      );
    }

    await db.delete(nativeBanners).where(eq(nativeBanners.id, bannerId));

    return NextResponse.json({
      success: true,
      message: 'Banner 已删除',
    });
  } catch (error) {
    console.error('❌ [Admin] 删除 Banner 失败:', error);

    const message = error instanceof Error ? error.message : 'Failed to delete banner';
    const status = message === '无权限访问' || message === '未登录' ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
