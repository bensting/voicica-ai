/**
 * Story Ideas API
 *
 * POST /api/v1/story/ideas
 * 生成故事创意列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateStoryIdeas } from '@/lib/services/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keywords, locale } = body;

    console.log(`📖 [Story] 生成故事创意, keywords: ${keywords || '(empty)'}, locale: ${locale || 'en-US'}`);

    const ideas = await generateStoryIdeas(keywords, locale);

    console.log(`✅ [Story] 生成了 ${ideas.length} 个故事创意`);

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error) {
    console.error('❌ [Story] 生成故事创意失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate story ideas',
      },
      { status: 500 }
    );
  }
}
