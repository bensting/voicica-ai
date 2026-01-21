/**
 * Generate Music Style API
 *
 * POST /api/ai/generate-style
 * 使用 AI 生成音乐风格标签
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateMusicStyle } from '@/lib/services/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is required',
        },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is too long (max 500 characters)',
        },
        { status: 400 }
      );
    }

    console.log(`🎵 [Style] 生成风格: ${prompt.substring(0, 50)}...`);

    const style = await generateMusicStyle(prompt);

    console.log(`✅ [Style] 风格生成成功: ${style}`);

    return NextResponse.json({
      success: true,
      style,
    });
  } catch (error) {
    console.error('❌ [Style] 生成风格失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate style',
      },
      { status: 500 }
    );
  }
}
