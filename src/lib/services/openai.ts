/**
 * OpenAI Service
 *
 * 用于故事生成的 OpenAI API 封装
 */
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StoryIdea {
  title: string;
  description: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
}

/**
 * 故事场景
 */
export interface StoryScene {
  /** 场景描述（原文语言） */
  description: string;
  /** 图片生成提示词（英文） */
  prompt: string;
  /** 对应段落索引 */
  paragraphIndex: number;
}

// 语言代码到语言名称的映射
const localeToLanguage: Record<string, string> = {
  'en-US': 'English',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  'ja-JP': 'Japanese',
  'th-TH': 'Thai',
  'vi-VN': 'Vietnamese',
  'es-ES': 'Spanish',
  'pt-BR': 'Portuguese',
  'hi-IN': 'Hindi',
  'id-ID': 'Indonesian',
  'my-MM': 'Burmese',
  'ar-SA': 'Arabic',
};

/**
 * 生成故事创意
 * @param keywords 用户输入的关键词（可选）
 * @param locale 网页语言设置（用于无关键词时生成对应语言的创意）
 * @returns 3-4 个故事创意
 */
export async function generateStoryIdeas(keywords?: string, locale?: string): Promise<StoryIdea[]> {
  const targetLanguage = localeToLanguage[locale || 'en-US'] || 'English';

  const prompt = keywords
    ? `Based on the keywords "${keywords}", generate 4 creative children's story ideas. Each idea should have a title and a brief description (2-3 sentences).

IMPORTANT: Detect the language of the keywords and respond in the SAME language.

Respond in JSON format:
[
  {"title": "Story Title", "description": "Brief description of the story"},
  ...
]`
    : `Generate 4 creative and diverse children's story ideas. Each idea should have a title and a brief description (2-3 sentences).

IMPORTANT: You MUST respond in ${targetLanguage}.

Respond in JSON format:
[
  {"title": "Story Title in ${targetLanguage}", "description": "Brief description in ${targetLanguage}"},
  ...
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a creative children\'s story writer. Generate engaging, age-appropriate story ideas that are imaginative and fun. Always respond with valid JSON array.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    // Handle both array and object with ideas property
    const ideas = Array.isArray(parsed) ? parsed : (parsed.ideas || parsed.stories || []);
    return ideas.slice(0, 4);
  } catch {
    throw new Error('Failed to parse story ideas from OpenAI response');
  }
}

/**
 * 生成完整故事
 * @param title 故事标题
 * @param description 故事描述
 * @returns 完整的故事内容
 */
export async function generateFullStory(title: string, description: string): Promise<GeneratedStory> {
  const prompt = `Write a complete children's story based on:
Title: "${title}"
Description: "${description}"

Requirements:
- The story should be 300-500 words
- Include a clear beginning, middle, and end
- Use vivid descriptions and engaging dialogue
- Make it age-appropriate for children (5-10 years old)
- The moral or lesson should be subtle, not preachy

IMPORTANT: Detect the language of the title and description, and write the story in the SAME language.

Respond in JSON format:
{
  "title": "The final story title",
  "content": "The complete story text..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a talented children\'s story writer. Write engaging, imaginative stories that captivate young readers while teaching valuable lessons. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || title,
      content: parsed.content || parsed.story || '',
    };
  } catch {
    throw new Error('Failed to parse story from OpenAI response');
  }
}

/**
 * 从故事中提取关键场景用于生成插图
 *
 * @param title 故事标题
 * @param content 故事内容
 * @param sceneCount 要提取的场景数量（默认 4）
 * @returns 场景列表，包含描述和英文提示词
 */
export async function extractStoryScenes(
  title: string,
  content: string,
  sceneCount: number = 4
): Promise<StoryScene[]> {
  const prompt = `Analyze this children's story and extract ${sceneCount} key scenes that would make great illustrations.

Story Title: "${title}"

Story Content:
${content}

For each scene, provide:
1. "description": A brief description of the scene in the SAME LANGUAGE as the story (this will be shown to users)
2. "prompt": A detailed image generation prompt in ENGLISH for creating a children's book illustration. Include:
   - Main characters and their appearance
   - Setting and environment details
   - Actions or emotions being depicted
   - Art style: "children's book illustration, whimsical, colorful, warm lighting"
3. "paragraphIndex": The approximate paragraph number (0-indexed) where this scene occurs

Important:
- Select visually distinct and emotionally impactful moments
- Ensure the prompts describe child-friendly, age-appropriate scenes
- Include specific visual details that capture the essence of each scene

Respond in JSON format:
{
  "scenes": [
    {
      "description": "Scene description in original language",
      "prompt": "Detailed English prompt for image generation...",
      "paragraphIndex": 0
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing children\'s stories and identifying key visual moments for illustration. You create detailed, vivid image generation prompts that capture the essence of each scene while maintaining a child-friendly, whimsical art style. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(responseContent);
    const scenes = parsed.scenes || [];
    return scenes.slice(0, sceneCount).map((scene: StoryScene) => ({
      description: scene.description,
      prompt: scene.prompt,
      paragraphIndex: scene.paragraphIndex || 0,
    }));
  } catch {
    throw new Error('Failed to parse scenes from OpenAI response');
  }
}

/**
 * 生成故事封面的提示词
 *
 * @param title 故事标题
 * @param content 故事内容（会截取前 500 字）
 * @returns 封面图片的英文提示词
 */
export async function generateCoverPrompt(title: string, content: string): Promise<string> {
  const truncatedContent = content.substring(0, 500);

  const prompt = `Create an image generation prompt for a children's book COVER illustration.

Story Title: "${title}"
Story Summary: ${truncatedContent}...

Generate a single, detailed English prompt that:
1. Captures the main theme and mood of the story
2. Features the main character(s) prominently
3. Uses vibrant, eye-catching colors suitable for a book cover
4. Has a centered, balanced composition
5. Includes the art style: "children's book cover art, professional illustration, magical atmosphere, vibrant colors"

Respond in JSON format:
{
  "prompt": "Your detailed image generation prompt here..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at creating compelling book cover designs for children\'s stories. You write detailed, vivid image generation prompts that capture attention and convey the essence of the story. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(responseContent);
    return parsed.prompt || '';
  } catch {
    throw new Error('Failed to parse cover prompt from OpenAI response');
  }
}

/**
 * 为单个段落生成插图提示词
 *
 * @param storyTitle 故事标题
 * @param paragraphContent 段落内容
 * @param paragraphIndex 段落索引（用于上下文）
 * @param totalParagraphs 总段落数
 * @returns 图片生成的英文提示词
 */
export async function generateParagraphIllustrationPrompt(
  storyTitle: string,
  paragraphContent: string,
  paragraphIndex: number,
  totalParagraphs: number
): Promise<string> {
  const positionHint =
    paragraphIndex === 0
      ? 'opening scene'
      : paragraphIndex === totalParagraphs - 1
        ? 'ending/conclusion scene'
        : `middle of the story (paragraph ${paragraphIndex + 1} of ${totalParagraphs})`;

  const prompt = `Create an image generation prompt for a children's book illustration based on this paragraph.

Story Title: "${storyTitle}"
Position: ${positionHint}

Paragraph Content:
${paragraphContent}

Generate a detailed English prompt that:
1. Captures the key visual elements of this paragraph
2. Maintains consistency with children's book illustration style
3. Includes specific details about characters, setting, and action
4. Uses child-friendly, warm, and inviting imagery
5. Art style: "children's book illustration, whimsical, colorful, warm lighting, professional quality"

Respond in JSON format:
{
  "prompt": "Your detailed image generation prompt here..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          "You are an expert at creating children's book illustrations. You write detailed, vivid image generation prompts that capture the essence of each scene while maintaining a child-friendly, whimsical art style. Always respond with valid JSON.",
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(responseContent);
    return parsed.prompt || '';
  } catch {
    throw new Error('Failed to parse illustration prompt from OpenAI response');
  }
}
