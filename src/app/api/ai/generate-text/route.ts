/**
 * Generate Text API
 *
 * POST /api/ai/generate-text
 * 使用 AI 生成语音/旁白文本
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateSpeechText } from '@/lib/services/openai';

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

    console.log(`📝 [Text] 生成文本: ${prompt.substring(0, 50)}...`);

    const text = await generateSpeechText(prompt);

    console.log(`✅ [Text] 文本生成成功, 长度: ${text.length} 字符`);

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error('❌ [Text] 生成文本失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate text',
      },
      { status: 500 }
    );
  }
}
