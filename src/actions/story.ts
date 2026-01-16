'use server';

/**
 * Story Generation Server Actions
 *
 * 故事生成相关的 Server Actions
 * 包含积分检查和扣除逻辑
 */

import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { checkCredits, deductCredits } from '@/lib/credits';
import { generateStoryIdeas as generateIdeasFromOpenAI, generateFullStory as generateStoryFromOpenAI } from '@/lib/services/openai';
import type { StoryIdea, GeneratedStory } from '@/lib/services/openai';

/**
 * 故事创意生成结果
 */
export interface StoryIdeasResult {
  success: boolean;
  ideas?: StoryIdea[];
  error?: string;
  errorCode?: 'INSUFFICIENT_CREDITS' | 'GENERATION_FAILED' | 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'UNKNOWN_ERROR';
  errorData?: { required: number; current: number };
  creditsCost?: number;
}

/**
 * 故事生成结果
 */
export interface StoryGenerateResult {
  success: boolean;
  story?: GeneratedStory;
  error?: string;
  errorCode?: 'INSUFFICIENT_CREDITS' | 'GENERATION_FAILED' | 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'UNKNOWN_ERROR';
  errorData?: { required: number; current: number };
  creditsCost?: number;
}

/**
 * 生成故事创意
 *
 * @param keywords 用户输入的关键词（可选）
 * @param locale 网页语言设置
 */
export async function getStoryIdeas(keywords?: string, locale?: string): Promise<StoryIdeasResult> {
  console.log('📖 [getStoryIdeas] 开始生成故事创意');

  try {
    // 1. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('📖 [getStoryIdeas] 用户认证成功:', { userId, isAnonymous });

    // 2. 检查是否为匿名用户（故事功能仅限登录用户）
    if (isAnonymous) {
      console.log('⚠️ [getStoryIdeas] 匿名用户无法使用此功能');
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to generate story ideas',
      };
    }

    // 3. 计算所需积分
    const requiredCredits = calculateProductCreditsCost(ProductType.STORY_IDEAS);

    console.log('📖 [getStoryIdeas] 所需积分:', requiredCredits);

    // 4. 检查积分是否足够
    if (requiredCredits > 0) {
      const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);

      if (!hasEnough) {
        console.log(`⚠️ [getStoryIdeas] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
        return {
          success: false,
          errorCode: 'INSUFFICIENT_CREDITS',
          errorData: { required: requiredCredits, current },
        };
      }

      console.log('✅ [getStoryIdeas] 积分充足:', current);
    }

    // 5. 调用 OpenAI 生成故事创意
    const ideas = await generateIdeasFromOpenAI(keywords, locale);

    console.log(`✅ [getStoryIdeas] 生成了 ${ideas.length} 个故事创意`);

    // 6. 生成成功，扣除积分
    if (requiredCredits > 0) {
      await deductCredits(
        userId,
        requiredCredits,
        ProductType.STORY_IDEAS,
        isAnonymous,
        `Story ideas generation${keywords ? `: ${keywords.substring(0, 50)}` : ''}`
      );
      console.log('✅ [getStoryIdeas] 积分扣除成功');
    }

    return {
      success: true,
      ideas,
      creditsCost: requiredCredits,
    };
  } catch (error) {
    console.error('❌ [getStoryIdeas] 生成故事创意失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      errorCode: 'GENERATION_FAILED',
      error: error instanceof Error ? error.message : 'Failed to generate story ideas',
    };
  }
}

/**
 * 生成完整故事
 *
 * @param title 故事标题
 * @param description 故事描述
 */
export async function generateStory(title: string, description: string): Promise<StoryGenerateResult> {
  console.log('📖 [generateStory] 开始生成完整故事');

  try {
    // 1. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('📖 [generateStory] 用户认证成功:', { userId, isAnonymous });

    // 2. 检查是否为匿名用户（故事功能仅限登录用户）
    if (isAnonymous) {
      console.log('⚠️ [generateStory] 匿名用户无法使用此功能');
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to generate story',
      };
    }

    // 3. 计算所需积分
    const requiredCredits = calculateProductCreditsCost(ProductType.STORY_GENERATE);

    console.log('📖 [generateStory] 所需积分:', requiredCredits);

    // 4. 检查积分是否足够
    if (requiredCredits > 0) {
      const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);

      if (!hasEnough) {
        console.log(`⚠️ [generateStory] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
        return {
          success: false,
          errorCode: 'INSUFFICIENT_CREDITS',
          errorData: { required: requiredCredits, current },
        };
      }

      console.log('✅ [generateStory] 积分充足:', current);
    }

    // 5. 调用 OpenAI 生成完整故事
    const story = await generateStoryFromOpenAI(title, description);

    console.log('✅ [generateStory] 故事生成成功:', story.title);

    // 6. 生成成功，扣除积分
    if (requiredCredits > 0) {
      await deductCredits(
        userId,
        requiredCredits,
        ProductType.STORY_GENERATE,
        isAnonymous,
        `Story generation: ${title.substring(0, 50)}`
      );
      console.log('✅ [generateStory] 积分扣除成功');
    }

    return {
      success: true,
      story,
      creditsCost: requiredCredits,
    };
  } catch (error) {
    console.error('❌ [generateStory] 生成故事失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      errorCode: 'GENERATION_FAILED',
      error: error instanceof Error ? error.message : 'Failed to generate story',
    };
  }
}

/**
 * 保存故事到数据库
 */
export interface SaveStoryParams {
  title: string;
  content: string;
  keywords?: string;
  ideaTitle?: string;
  ideaDescription?: string;
  locale?: string;
}

export interface SaveStoryResult {
  success: boolean;
  storyId?: string;
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'SAVE_FAILED';
}

export async function saveStory(params: SaveStoryParams): Promise<SaveStoryResult> {
  console.log('📖 [saveStory] 开始保存故事');

  try {
    // 1. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('📖 [saveStory] 用户认证成功:', { userId, isAnonymous });

    // 2. 检查是否为匿名用户（保存功能仅限登录用户）
    if (isAnonymous) {
      console.log('⚠️ [saveStory] 匿名用户无法保存故事');
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to save story',
      };
    }

    // 3. 计算字数
    const wordCount = params.content.length;

    // 4. 保存到数据库
    const { prisma } = await import('@/lib/prisma');

    const story = await prisma.stories.create({
      data: {
        user_id: userId,
        title: params.title,
        content: params.content,
        keywords: params.keywords || null,
        idea_title: params.ideaTitle || null,
        idea_description: params.ideaDescription || null,
        locale: params.locale || 'en-US',
        word_count: wordCount,
        status: 'draft',
      },
    });

    console.log('✅ [saveStory] 故事保存成功:', story.id);

    return {
      success: true,
      storyId: story.id,
    };
  } catch (error) {
    console.error('❌ [saveStory] 保存故事失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      errorCode: 'SAVE_FAILED',
      error: error instanceof Error ? error.message : 'Failed to save story',
    };
  }
}

/**
 * 故事关联的音频
 */
export interface StoryAudio {
  id: number;
  taskId: string;
  audioUrl: string | null;
  duration: number | null;
  status: string;
  voiceName: string;
  createdAt: Date;
}

/**
 * 用户故事项
 */
export interface UserStory {
  id: string;
  title: string;
  content: string;
  keywords: string | null;
  wordCount: number;
  status: string;
  videoStatus: string;
  createdAt: Date;
  illustrationCount: number;
  audioCount: number;
  latestAudio: StoryAudio | null; // 最新的音频
}

/**
 * 获取用户故事列表结果
 */
export interface GetUserStoriesResult {
  success: boolean;
  stories?: UserStory[];
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'FETCH_FAILED';
}

/**
 * 获取用户的故事列表
 */
export async function getUserStories(): Promise<GetUserStoriesResult> {
  console.log('📖 [getUserStories] 获取用户故事列表');

  try {
    // 1. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('📖 [getUserStories] 用户认证成功:', { userId, isAnonymous });

    // 2. 检查是否为匿名用户
    if (isAnonymous) {
      console.log('⚠️ [getUserStories] 匿名用户无法查看故事');
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to view stories',
      };
    }

    // 3. 从数据库获取故事列表
    const { prisma } = await import('@/lib/prisma');

    const stories = await prisma.stories.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { illustrations: true, tts_records: true },
        },
        tts_records: {
          orderBy: { created_at: 'desc' },
          take: 1, // 只取最新的一条
          select: {
            id: true,
            task_id: true,
            audio_url: true,
            duration: true,
            status: true,
            voice_name: true,
            created_at: true,
          },
        },
      },
    });

    console.log(`✅ [getUserStories] 获取到 ${stories.length} 个故事`);

    return {
      success: true,
      stories: stories.map((story) => {
        const latestTts = story.tts_records[0];
        return {
          id: story.id,
          title: story.title,
          content: story.content,
          keywords: story.keywords,
          wordCount: story.word_count,
          status: story.status,
          videoStatus: story.video_status,
          createdAt: story.created_at,
          illustrationCount: story._count.illustrations,
          audioCount: story._count.tts_records,
          latestAudio: latestTts ? {
            id: latestTts.id,
            taskId: latestTts.task_id,
            audioUrl: latestTts.audio_url,
            duration: latestTts.duration,
            status: latestTts.status,
            voiceName: latestTts.voice_name,
            createdAt: latestTts.created_at,
          } : null,
        };
      }),
    };
  } catch (error) {
    console.error('❌ [getUserStories] 获取故事失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      errorCode: 'FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Failed to fetch stories',
    };
  }
}

/**
 * 删除故事结果
 */
export interface DeleteStoryResult {
  success: boolean;
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'NOT_FOUND' | 'DELETE_FAILED';
}

/**
 * 删除故事
 *
 * @param storyId 故事 ID
 */
export async function deleteStory(storyId: string): Promise<DeleteStoryResult> {
  console.log('📖 [deleteStory] 删除故事:', storyId);

  try {
    // 1. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('📖 [deleteStory] 用户认证成功:', { userId, isAnonymous });

    // 2. 检查是否为匿名用户
    if (isAnonymous) {
      console.log('⚠️ [deleteStory] 匿名用户无法删除故事');
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to delete story',
      };
    }

    // 3. 检查故事是否存在且属于当前用户
    const { prisma } = await import('@/lib/prisma');

    const story = await prisma.stories.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: 'Story not found',
      };
    }

    if (story.user_id !== userId) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: 'Story not found',
      };
    }

    // 4. 删除故事（关联的 tts_records 和 illustrations 会通过 onDelete: SetNull/Cascade 处理）
    await prisma.stories.delete({
      where: { id: storyId },
    });

    console.log('✅ [deleteStory] 故事删除成功:', storyId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('❌ [deleteStory] 删除故事失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      errorCode: 'DELETE_FAILED',
      error: error instanceof Error ? error.message : 'Failed to delete story',
    };
  }
}
