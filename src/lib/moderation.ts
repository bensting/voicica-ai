/**
 * Content Moderation Utility
 * 使用 OpenAI Moderation API 检查内容是否违规
 *
 * 通过 config/native/moderationConfig.ts 控制开关
 */
import OpenAI from 'openai';
import { moderationConfig } from '@/config/native/moderationConfig';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 检查内容审核是否启用
 */
function isContentModerationEnabled(): boolean {
  return moderationConfig.enableContentModeration;
}

/**
 * 审核结果
 */
export interface ModerationResult {
  /** 是否通过审核（true = 内容安全，false = 内容违规） */
  passed: boolean;
  /** 违规类别（如果有） */
  flaggedCategories?: string[];
  /** 原始审核响应 */
  raw?: OpenAI.Moderations.ModerationCreateResponse;
}

/**
 * 需要拦截的违规类别
 * 参考: https://platform.openai.com/docs/guides/moderation
 */
const BLOCKED_CATEGORIES = [
  'sexual',
  'sexual/minors',
  // 以下类别可根据需要启用
  // 'hate',
  // 'hate/threatening',
  // 'harassment',
  // 'harassment/threatening',
  // 'self-harm',
  // 'self-harm/intent',
  // 'self-harm/instructions',
  // 'violence',
  // 'violence/graphic',
] as const;

/**
 * 检查文本内容是否违规
 * @param text 要检查的文本
 * @returns 审核结果
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });

    const result = response.results[0];

    if (!result) {
      // 如果没有结果，默认通过（避免阻塞用户）
      console.warn('[moderation] No result from OpenAI Moderation API');
      return { passed: true };
    }

    // 检查是否有被拦截的类别被标记
    const flaggedCategories: string[] = [];

    for (const category of BLOCKED_CATEGORIES) {
      // categories 对象的键使用 / 分隔，但 TypeScript 类型使用不同格式
      const categoryKey = category as keyof typeof result.categories;
      if (result.categories[categoryKey]) {
        flaggedCategories.push(category);
      }
    }

    const passed = flaggedCategories.length === 0;

    if (!passed) {
      console.log(`[moderation] Content flagged for: ${flaggedCategories.join(', ')}`);
      console.log(`[moderation] Input text (first 100 chars): ${text.substring(0, 100)}...`);
    }

    return {
      passed,
      flaggedCategories: flaggedCategories.length > 0 ? flaggedCategories : undefined,
      raw: response,
    };
  } catch (error) {
    // 如果 API 调用失败，记录错误但默认通过（避免阻塞用户）
    console.error('[moderation] Error calling OpenAI Moderation API:', error);
    return { passed: true };
  }
}

/**
 * 检查图片生成提示词是否违规
 * 专门用于图片生成场景，可以添加额外的检查逻辑
 *
 * 注意：如果 moderationConfig.enableContentModeration 为 false，将直接返回通过
 */
export async function moderateImagePrompt(prompt: string): Promise<ModerationResult> {
  // 检查开关是否启用
  if (!isContentModerationEnabled()) {
    return { passed: true };
  }

  // 使用通用的内容审核
  return moderateContent(prompt);
}
