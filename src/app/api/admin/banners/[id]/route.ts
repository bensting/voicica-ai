/**
 * Admin Single Banner API
 *
 * PUT /api/admin/banners/[id] - 更新 Banner
 * DELETE /api/admin/banners/[id] - 删除 Banner
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 更新 Banner
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const existing = await prisma.native_banners.findUnique({
      where: { id: bannerId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner 不存在' },
        { status: 404 }
      );
    }

    // 更新
    const banner = await prisma.native_banners.update({
      where: { id: bannerId },
      data: {
        ...(imageUrl !== undefined && { image_url: imageUrl }),
        ...(linkUrl !== undefined && { link_url: linkUrl || null }),
        ...(titles !== undefined && { titles }),
        ...(subtitles !== undefined && { subtitles }),
        ...(buttonTexts !== undefined && { button_texts: buttonTexts || null }),
        ...(sortOrder !== undefined && { sort_order: sortOrder }),
        ...(isActive !== undefined && { is_active: isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      banner: {
        id: banner.id,
        imageUrl: banner.image_url,
        linkUrl: banner.link_url,
        titles: banner.titles,
        subtitles: banner.subtitles,
        buttonTexts: banner.button_texts,
        sortOrder: banner.sort_order,
        isActive: banner.is_active,
        updatedAt: banner.updated_at?.toISOString(),
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
    const existing = await prisma.native_banners.findUnique({
      where: { id: bannerId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner 不存在' },
        { status: 404 }
      );
    }

    await prisma.native_banners.delete({
      where: { id: bannerId },
    });

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
