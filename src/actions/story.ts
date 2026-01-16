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
