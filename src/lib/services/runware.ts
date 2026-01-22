/**
 * Runware Service
 *
 * AI 图片生成服务，用于故事插图生成
 * 文档: https://runware.ai/docs/en/libraries/javascript
 */

import { Runware, type ITextToImage } from '@runware/sdk-js';

// Runware 客户端实例（懒加载）
let runwareClient: InstanceType<typeof Runware> | null = null;

/**
 * 获取 Runware 客户端实例
 */
function getRunwareClient(): InstanceType<typeof Runware> {
  if (!runwareClient) {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      throw new Error('RUNWARE_API_KEY environment variable is not set');
    }
    runwareClient = new Runware({
      apiKey,
      shouldReconnect: true,
      globalMaxRetries: 3,
      timeoutDuration: 120000, // 2 minutes timeout
    });
  }
  return runwareClient;
}

/**
 * 图片生成参数
 */
export interface GenerateImageParams {
  /** 正向提示词（英文） */
  prompt: string;
  /** 负向提示词（可选） */
  negativePrompt?: string;
  /** 图片宽度（默认 1024） */
  width?: number;
  /** 图片高度（默认 1024） */
  height?: number;
  /** 生成数量（默认 1） */
  numberResults?: number;
  /** 模型 ID（默认使用 FLUX） */
  model?: string;
}

/**
 * 图片生成结果
 */
export interface GeneratedImage {
  /** 图片 UUID */
  imageUUID: string;
  /** 任务 UUID */
  taskUUID: string;
  /** 图片 URL */
  imageURL: string;
  /** 是否为 NSFW 内容 */
  NSFWContent?: boolean;
  /** 消耗的积分 */
  cost: number;
}

/**
 * 默认模型配置
 * 使用 Juggernaut Lightning Flux by RunDiffusion（快速、高质量、性价比高）
 * 768x768 仅 $0.0008/张
 */
const DEFAULT_MODEL = 'rundiffusion:110@101'; // Juggernaut Lightning Flux

/**
 * 默认图片尺寸
 */
const DEFAULT_SIZE = 768;

/**
 * 默认负向提示词
 */
const DEFAULT_NEGATIVE_PROMPT = 'blurry, low quality, distorted, ugly, bad anatomy, bad hands, missing fingers, extra fingers, text, watermark, signature, nsfw, nude, violence, gore';

/**
 * 生成图片
 *
 * @param params 生成参数
 * @returns 生成的图片列表
 *
 * @example
 * const images = await generateImage({
 *   prompt: "A cute little monk meditating under a cherry blossom tree, children's book illustration style",
 *   width: 1024,
 *   height: 1024,
 * });
 */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage[]> {
  const client = getRunwareClient();

  const {
    prompt,
    negativePrompt = DEFAULT_NEGATIVE_PROMPT,
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    numberResults = 1,
    model = DEFAULT_MODEL,
  } = params;

  console.log('🎨 [Runware] Generating image:', {
    prompt: prompt.substring(0, 100) + '...',
    width,
    height,
    numberResults,
    model,
  });

  try {
    const results = await client.imageInference({
      positivePrompt: prompt,
      negativePrompt,
      width,
      height,
      numberResults,
      model,
      outputType: 'URL',
      outputFormat: 'WEBP',
      checkNSFW: true,
    });

    if (!results || results.length === 0) {
      throw new Error('No images generated');
    }

    console.log(`✅ [Runware] Generated ${results.length} image(s)`);

    return results.map((result: ITextToImage) => ({
      imageUUID: result.imageUUID || '',
      taskUUID: result.taskUUID || '',
      imageURL: result.imageURL || '',
      NSFWContent: result.NSFWContent,
      cost: result.cost || 0,
    }));
  } catch (error) {
    console.error('❌ [Runware] Image generation failed:', error);
    throw error;
  }
}

/**
 * 批量生成图片（并行）
 *
 * @param paramsList 多组生成参数
 * @returns 所有生成的图片
 */
export async function generateImages(paramsList: GenerateImageParams[]): Promise<GeneratedImage[][]> {
  const results = await Promise.all(
    paramsList.map((params) => generateImage(params))
  );
  return results;
}

/**
 * 生成故事封面
 *
 * @param title 故事标题
 * @param description 故事简介
 * @returns 生成的封面图片
 */
export async function generateStoryCover(
  title: string,
  description: string
): Promise<GeneratedImage> {
  const prompt = `Children's book cover illustration for "${title}". ${description}. Vibrant colors, whimsical style, professional children's book art, centered composition, magical atmosphere.`;

  const results = await generateImage({
    prompt,
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
    numberResults: 1,
  });

  return results[0];
}

/**
 * 生成故事场景插图
 *
 * @param scenePrompt 场景提示词（英文）
 * @param index 场景索引（用于日志）
 * @returns 生成的场景图片
 */
export async function generateSceneIllustration(
  scenePrompt: string,
  index: number
): Promise<GeneratedImage> {
  console.log(`🎨 [Runware] Generating scene ${index + 1}:`, scenePrompt.substring(0, 80) + '...');

  const results = await generateImage({
    prompt: scenePrompt,
    width: 1024,
    height: 768, // 横向比例，更适合故事插图
    numberResults: 1,
  });

  return results[0];
}

/**
 * 断开 Runware 连接
 */
export async function disconnectRunware(): Promise<void> {
  if (runwareClient) {
    await runwareClient.disconnect();
    runwareClient = null;
    console.log('🔌 [Runware] Disconnected');
  }
}
