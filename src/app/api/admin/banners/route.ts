/**
 * Admin Banners API
 *
 * GET /api/admin/banners - 获取所有 Banner（含未启用）
 * POST /api/admin/banners - 创建新 Banner
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth-admin';

// 获取所有 Banner
export async function GET() {
  try {
    await verifyAdmin();

    const banners = await prisma.native_banners.findMany({
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      banners: banners.map((b) => ({
        id: b.id,
        imageUrl: b.image_url,
        linkUrl: b.link_url,
        titles: b.titles,
        subtitles: b.subtitles,
        buttonTexts: b.button_texts,
        sortOrder: b.sort_order,
        isActive: b.is_active,
        createdAt: b.created_at?.toISOString(),
        updatedAt: b.updated_at?.toISOString(),
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

    const banner = await prisma.native_banners.create({
      data: {
        image_url: imageUrl,
        link_url: linkUrl || null,
        titles: titles,
        subtitles: subtitles,
        button_texts: buttonTexts || null,
        sort_order: sortOrder ?? 0,
        is_active: isActive ?? true,
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
        createdAt: banner.created_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [Admin] 创建 Banner 失败:', error);

    const message = error instanceof Error ? error.message : 'Failed to create banner';
    const status = message === '无权限访问' || message === '未登录' ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
