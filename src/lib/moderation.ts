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
 * 需要拦截的违规类别及其阈值
 * 参考: https://platform.openai.com/docs/guides/moderation
 *
 * OpenAI 默认阈值较高，我们降低阈值以更严格地检测
 * category_scores 范围是 0-1，越高表示越可能违规
 */
const BLOCKED_CATEGORIES_CONFIG: Record<string, number> = {
  // 性相关内容 - 使用较低阈值更严格检测
  'sexual': 0.2,
  'sexual/minors': 0.1,
  // 以下类别可根据需要启用
  // 'hate': 0.5,
  // 'hate/threatening': 0.5,
  // 'harassment': 0.5,
  // 'harassment/threatening': 0.5,
  // 'self-harm': 0.5,
  // 'self-harm/intent': 0.5,
  // 'self-harm/instructions': 0.5,
  // 'violence': 0.5,
  // 'violence/graphic': 0.5,
};

/**
 * 图片生成场景的自定义敏感词黑名单
 * OpenAI Moderation API 可能会漏掉一些在图片生成场景下不适当的词汇
 */
const IMAGE_PROMPT_BLOCKED_KEYWORDS = [
  // 身体部位相关的敏感词
  'nipple',
  'nipples',
  'areola',
  'breast',
  'breasts',
  'boob',
  'boobs',
  'tit',
  'tits',
  'titty',
  'titties',
  'cleavage',
  'topless',
  'braless',
  'busty',
  'sideboob',
  // 下体相关
  'genital',
  'genitals',
  'penis',
  'vagina',
  'pussy',
  'dick',
  'cock',
  'clit',
  'clitoris',
  'labia',
  'scrotum',
  'testicle',
  'testicles',
  'balls',
  'pubic',
  'crotch',
  'groin',
  // 臀部相关
  'butt',
  'buttocks',
  'ass',
  'anus',
  'anal',
  'booty',
  // 性行为相关
  'nude',
  'naked',
  'nudity',
  'sex',
  'sexual',
  'sexy',
  'erotic',
  'porn',
  'pornography',
  'xxx',
  'nsfw',
  'hentai',
  'masturbat',
  'orgasm',
  'climax',
  'ejaculat',
  'cum',
  'cumshot',
  'blowjob',
  'handjob',
  'footjob',
  'titjob',
  'fingering',
  'penetrat',
  'intercourse',
  'fornication',
  'copulation',
  'stimulat',
  'arousal',
  'arouse',
  'seduc',
  'sensual',
  'lustful',
  'horny',
  'kinky',
  'fetish',
  'bondage',
  'bdsm',
  'dominatrix',
  'submissive',
  'sadomaso',
  // 服装相关敏感词
  'lingerie',
  'underwear',
  'panties',
  'thong',
  'g-string',
  'bikini',
  'swimsuit',
  'bra',
  'corset',
  'striptease',
  'stripper',
  // 姿势/动作相关
  'spread legs',
  'spread eagle',
  'bent over',
  'on all fours',
  'doggy',
  'missionary',
  'cowgirl',
  // 其他
  'slutty',
  'slut',
  'whore',
  'prostitut',
  'escort',
  'call girl',
  'hooker',
  'playboy',
  'playgirl',
  'suggestive',
  'provocative',
  'revealing',
  'skimpy',
  'see-through',
  'transparent',
  'wet t-shirt',
  'camel toe',
  'bulge',
];

/**
 * 检查文本是否包含敏感词（不区分大小写）
 */
function containsBlockedKeyword(text: string): { blocked: boolean; keyword?: string } {
  const lowerText = text.toLowerCase();

  for (const keyword of IMAGE_PROMPT_BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return { blocked: true, keyword };
    }
  }

  return { blocked: false };
}

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

    // 检查是否有被拦截的类别超过阈值
    const flaggedCategories: string[] = [];
    const categoryScores = result.category_scores;

    for (const [category, threshold] of Object.entries(BLOCKED_CATEGORIES_CONFIG)) {
      // 使用类型断言访问动态属性
      const score = (categoryScores as unknown as Record<string, number>)[category];
      if (score !== undefined && score >= threshold) {
        flaggedCategories.push(`${category}(${score.toFixed(3)})`);
      }
    }

    const passed = flaggedCategories.length === 0;

    if (!passed) {
      console.log(`[moderation] Content flagged for: ${flaggedCategories.join(', ')}`);
      console.log(`[moderation] Input text (first 100 chars): ${text.substring(0, 100)}...`);
      // 记录所有分数用于调试
      console.log(`[moderation] All scores:`, JSON.stringify(categoryScores, null, 2));
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

  // 首先进行本地敏感词检查（更快、更严格）
  const keywordCheck = containsBlockedKeyword(prompt);
  if (keywordCheck.blocked) {
    console.log(`[moderation] Image prompt blocked by keyword filter: "${keywordCheck.keyword}"`);
    console.log(`[moderation] Input prompt (first 100 chars): ${prompt.substring(0, 100)}...`);
    return {
      passed: false,
      flaggedCategories: ['blocked_keyword'],
    };
  }

  // 然后使用 OpenAI Moderation API 进行更全面的检查
  return moderateContent(prompt);
}
