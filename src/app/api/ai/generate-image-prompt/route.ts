/**
 * Generate Image Prompt API
 *
 * POST /api/ai/generate-image-prompt
 * 使用 AI 生成图片提示词
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateImagePrompt } from '@/lib/services/openai';

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

    console.log(`🖼️ [Image Prompt] Generating: ${prompt.substring(0, 50)}...`);

    const generatedPrompt = await generateImagePrompt(prompt);

    console.log(`✅ [Image Prompt] Generated: ${generatedPrompt.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error) {
    console.error('❌ [Image Prompt] Generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image prompt',
      },
      { status: 500 }
    );
  }
}
