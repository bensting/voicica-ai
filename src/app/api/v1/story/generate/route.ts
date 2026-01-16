/**
 * Generate Full Story API
 *
 * POST /api/v1/story/generate
 * 基于选中的创意生成完整故事
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateFullStory } from '@/lib/services/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and description are required',
        },
        { status: 400 }
      );
    }

    console.log(`📖 [Story] 生成完整故事: ${title}`);

    const story = await generateFullStory(title, description);

    console.log(`✅ [Story] 故事生成成功, 长度: ${story.content.length} 字符`);

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error('❌ [Story] 生成故事失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate story',
      },
      { status: 500 }
    );
  }
}
