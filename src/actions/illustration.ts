'use server';

/**
 * Story Illustration Server Actions
 *
 * 故事插图生成相关的 Server Actions
 */

import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { checkCredits, deductCredits } from '@/lib/credits';
import { extractStoryScenes, generateCoverPrompt } from '@/lib/services/openai';
import { generateImage } from '@/lib/services/runware';
import { prisma } from '@/lib/prisma';

/**
 * 插图类型
 */
export type IllustrationType = 'cover' | 'scene' | 'all';

/**
 * 插图生成模式
 */
export interface GenerateIllustrationsParams {
  /** 故事 ID */
  storyId: string;
  /** 生成类型: cover（仅封面）, scene（仅场景）, all（全部） */
  type: IllustrationType;
  /** 场景数量（仅当 type 包含 scene 时有效，默认 4） */
  sceneCount?: number;
}

/**
 * 生成结果
 */
export interface GenerateIllustrationsResult {
  success: boolean;
  /** 生成的插图 ID 列表 */
  illustrationIds?: string[];
  /** 消耗的总积分 */
  totalCredits?: number;
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'GENERATION_FAILED';
  errorData?: { required: number; current: number };
}

/**
 * 插图数据
 */
export interface IllustrationData {
  id: string;
  type: string;
  imageUrl: string | null;
  prompt: string | null;
  sceneDescription: string | null;
  position: number;
  status: string;
  createdAt: Date;
}

/**
 * 获取故事插图
 */
export interface GetStoryIllustrationsResult {
  success: boolean;
  illustrations?: IllustrationData[];
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'NOT_FOUND' | 'FETCH_FAILED';
}

/**
 * 生成故事插图
 */
export async function generateIllustrations(
  params: GenerateIllustrationsParams
): Promise<GenerateIllustrationsResult> {
  const { storyId, type, sceneCount = 4 } = params;

  console.log('🎨 [generateIllustrations] Starting:', { storyId, type, sceneCount });

  try {
    // 1. 验证用户
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    if (isAnonymous) {
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required to generate illustrations',
      };
    }

    // 2. 获取故事
    const story = await prisma.stories.findUnique({
      where: { id: storyId },
    });

    if (!story || story.user_id !== userId) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: 'Story not found',
      };
    }

    // 3. 计算需要生成的图片数量
    let imageCount = 0;
    if (type === 'cover') {
      imageCount = 1;
    } else if (type === 'scene') {
      imageCount = sceneCount;
    } else {
      // all
      imageCount = 1 + sceneCount;
    }

    // 4. 计算所需积分
    const creditPerImage = calculateProductCreditsCost(ProductType.STORY_ILLUSTRATION);
    const requiredCredits = creditPerImage * imageCount;

    console.log('🎨 [generateIllustrations] Credits required:', {
      imageCount,
      creditPerImage,
      requiredCredits,
    });

    // 5. 检查积分
    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);

    if (!hasEnough) {
      return {
        success: false,
        errorCode: 'INSUFFICIENT_CREDITS',
        errorData: { required: requiredCredits, current },
      };
    }

    // 6. 提取场景和生成提示词
    const illustrationsToCreate: Array<{
      type: 'cover' | 'scene';
      prompt: string;
      sceneDescription: string;
      position: number;
      paragraph: number | null;
    }> = [];

    // 生成封面提示词
    if (type === 'cover' || type === 'all') {
      console.log('🎨 [generateIllustrations] Generating cover prompt...');
      const coverPrompt = await generateCoverPrompt(story.title, story.content);
      illustrationsToCreate.push({
        type: 'cover',
        prompt: coverPrompt,
        sceneDescription: story.title,
        position: 0,
        paragraph: null,
      });
    }

    // 提取场景
    if (type === 'scene' || type === 'all') {
      console.log('🎨 [generateIllustrations] Extracting scenes...');
      const scenes = await extractStoryScenes(story.title, story.content, sceneCount);

      scenes.forEach((scene, index) => {
        illustrationsToCreate.push({
          type: 'scene',
          prompt: scene.prompt,
          sceneDescription: scene.description,
          position: type === 'all' ? index + 1 : index,
          paragraph: scene.paragraphIndex,
        });
      });
    }

    // 7. 创建插图记录（状态为 processing）
    const createdIllustrations = await Promise.all(
      illustrationsToCreate.map((ill) =>
        prisma.story_illustrations.create({
          data: {
            story_id: storyId,
            type: ill.type,
            prompt: ill.prompt,
            scene_description: ill.sceneDescription,
            position: ill.position,
            paragraph: ill.paragraph,
            status: 'processing',
            credits_cost: creditPerImage,
          },
        })
      )
    );

    console.log('🎨 [generateIllustrations] Created illustration records:', createdIllustrations.length);

    // 8. 并行生成所有图片
    const generationPromises = createdIllustrations.map(async (illustration) => {
      try {
        const results = await generateImage({
          prompt: illustration.prompt || '',
          width: illustration.type === 'cover' ? 1024 : 1024,
          height: illustration.type === 'cover' ? 1024 : 768,
          numberResults: 1,
        });

        const result = results[0];

        // 更新插图记录
        await prisma.story_illustrations.update({
          where: { id: illustration.id },
          data: {
            image_url: result.imageURL,
            task_id: result.taskUUID,
            status: 'completed',
          },
        });

        // 如果是场景插图，更新对应段落的 illustration_id
        if (illustration.paragraph !== null) {
          await prisma.story_paragraphs.updateMany({
            where: {
              story_id: storyId,
              position: illustration.paragraph,
            },
            data: {
              illustration_id: illustration.id,
            },
          });
        }

        return { id: illustration.id, success: true };
      } catch (error) {
        console.error(`❌ [generateIllustrations] Failed to generate image for ${illustration.id}:`, error);

        // 更新为失败状态
        await prisma.story_illustrations.update({
          where: { id: illustration.id },
          data: {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        return { id: illustration.id, success: false };
      }
    });

    const results = await Promise.all(generationPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`🎨 [generateIllustrations] Generation complete: ${successCount}/${results.length} successful`);

    // 9. 扣除积分（只扣成功生成的）
    const actualCredits = successCount * creditPerImage;
    if (actualCredits > 0) {
      await deductCredits(
        userId,
        actualCredits,
        ProductType.STORY_ILLUSTRATION,
        isAnonymous,
        `Story illustrations: ${story.title.substring(0, 30)}`
      );
    }

    return {
      success: true,
      illustrationIds: createdIllustrations.map((i) => i.id),
      totalCredits: actualCredits,
    };
  } catch (error) {
    console.error('❌ [generateIllustrations] Error:', error);

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
      error: error instanceof Error ? error.message : 'Failed to generate illustrations',
    };
  }
}

/**
 * 获取故事的所有插图
 */
export async function getStoryIllustrations(storyId: string): Promise<GetStoryIllustrationsResult> {
  console.log('🎨 [getStoryIllustrations] Fetching:', storyId);

  try {
    // 1. 验证用户
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    if (isAnonymous) {
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required',
      };
    }

    // 2. 验证故事归属
    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: { user_id: true },
    });

    if (!story || story.user_id !== userId) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: 'Story not found',
      };
    }

    // 3. 获取插图
    const illustrations = await prisma.story_illustrations.findMany({
      where: { story_id: storyId },
      orderBy: { position: 'asc' },
    });

    return {
      success: true,
      illustrations: illustrations.map((ill) => ({
        id: ill.id,
        type: ill.type,
        imageUrl: ill.image_url,
        prompt: ill.prompt,
        sceneDescription: ill.scene_description,
        position: ill.position,
        status: ill.status,
        createdAt: ill.created_at,
      })),
    };
  } catch (error) {
    console.error('❌ [getStoryIllustrations] Error:', error);

    return {
      success: false,
      errorCode: 'FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Failed to fetch illustrations',
    };
  }
}

/**
 * 删除插图
 */
export interface DeleteIllustrationResult {
  success: boolean;
  error?: string;
  errorCode?: 'AUTH_FAILED' | 'LOGIN_REQUIRED' | 'NOT_FOUND' | 'DELETE_FAILED';
}

export async function deleteIllustration(illustrationId: string): Promise<DeleteIllustrationResult> {
  console.log('🎨 [deleteIllustration] Deleting:', illustrationId);

  try {
    // 1. 验证用户
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    if (isAnonymous) {
      return {
        success: false,
        errorCode: 'LOGIN_REQUIRED',
        error: 'Login required',
      };
    }

    // 2. 验证插图归属
    const illustration = await prisma.story_illustrations.findUnique({
      where: { id: illustrationId },
      include: { story: { select: { user_id: true } } },
    });

    if (!illustration || illustration.story.user_id !== userId) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: 'Illustration not found',
      };
    }

    // 3. 删除
    await prisma.story_illustrations.delete({
      where: { id: illustrationId },
    });

    console.log('✅ [deleteIllustration] Deleted:', illustrationId);

    return { success: true };
  } catch (error) {
    console.error('❌ [deleteIllustration] Error:', error);

    return {
      success: false,
      errorCode: 'DELETE_FAILED',
      error: error instanceof Error ? error.message : 'Failed to delete illustration',
    };
  }
}
