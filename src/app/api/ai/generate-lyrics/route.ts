/**
 * Generate Lyrics API
 *
 * POST /api/ai/generate-lyrics
 * 使用 AI 生成歌词
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateLyrics } from '@/lib/services/openai';

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

    console.log(`🎵 [Lyrics] 生成歌词: ${prompt.substring(0, 50)}...`);

    const lyrics = await generateLyrics(prompt);

    console.log(`✅ [Lyrics] 歌词生成成功, 长度: ${lyrics.length} 字符`);

    return NextResponse.json({
      success: true,
      lyrics,
    });
  } catch (error) {
    console.error('❌ [Lyrics] 生成歌词失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate lyrics',
      },
      { status: 500 }
    );
  }
}
