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
