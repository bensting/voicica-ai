/**
 * Native App Banners API
 *
 * GET /api/v1/native/banners - 获取启用的 Banner 列表（公开）
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.native_banners.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        sort_order: 'asc',
      },
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
      })),
    });
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
