/**
 * Generate Music Prompt API
 *
 * POST /api/ai/generate-prompt
 * 使用 AI 生成音乐提示词
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateMusicPrompt } from '@/lib/services/openai';

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

    console.log(`🎵 [Prompt] 生成提示词: ${prompt.substring(0, 50)}...`);

    const generatedPrompt = await generateMusicPrompt(prompt);

    console.log(`✅ [Prompt] 提示词生成成功: ${generatedPrompt.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error) {
    console.error('❌ [Prompt] 生成提示词失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate prompt',
      },
      { status: 500 }
    );
  }
}
