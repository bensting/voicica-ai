/**
 * Generate Video Prompt API
 *
 * POST /api/ai/generate-video-prompt
 * 使用 AI 生成视频提示词
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateVideoPrompt } from '@/lib/services/openai';

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

    console.log(`🎬 [Video Prompt] Generating: ${prompt.substring(0, 50)}...`);

    const generatedPrompt = await generateVideoPrompt(prompt);

    console.log(`✅ [Video Prompt] Generated: ${generatedPrompt.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error) {
    console.error('❌ [Video Prompt] Generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video prompt',
      },
      { status: 500 }
    );
  }
}
