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
 * 生成故事创意
 * @param keywords 用户输入的关键词（可选）
 * @returns 3-4 个故事创意
 */
export async function generateStoryIdeas(keywords?: string): Promise<StoryIdea[]> {
  const prompt = keywords
    ? `Based on the keywords "${keywords}", generate 4 creative children's story ideas. Each idea should have a title and a brief description (1-2 sentences).

IMPORTANT: Detect the language of the keywords and respond in the SAME language.

Respond in JSON format:
[
  {"title": "Story Title", "description": "Brief description of the story"},
  ...
]`
    : `Generate 4 creative children's story ideas. Each idea should have a title and a brief description (1-2 sentences).

Respond in English.

Respond in JSON format:
[
  {"title": "Story Title", "description": "Brief description of the story"},
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
