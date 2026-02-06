// 首页展示素材配置
// 修改此文件即可更换所有首页素材

export const HOME_SHOWCASE_CONFIG = {
  // 背景图
  backgroundImage: '/images/home/hero-bg.png',

  // 左侧 AI Art 样图
  artworks: [
    {
      id: 1,
      src: 'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/d3de289da692ecfdacecef173b3dd450.png',
      alt: 'AI Art 1',
      prompt: 'Dramatic oil painting, a mysterious woman with dark hair and a lace veil, candlelit background, Caravaggio style, strong contrast of light and shadow.'
    },
    {
      id: 2,
      src: 'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/fd77c2dcd67818f002a294a8bcb3c17a.png',
      alt: 'AI Art 2',
      prompt: 'Portrait of a beautiful ethereal woman with long flowing red auburn hair, bright blue eyes, pink and purple roses and peonies adorning her hair, flowing teal and blue decorative swirls around her, dark moody background with pink and purple smoke effects, fantasy art style, dreamy atmosphere, soft lighting, highly detailed face, digital painting, 4k, portrait orientation, centered composition'
    },
    {
      id: 3,
      src: 'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/4ea7ad16645cb164712329bdda9b6e64.jpg',
      alt: 'AI Art 3',
      prompt: 'Create a portrait of a beautiful Thai woman and a charming Thai male star standing together in a romantic pose. The woman should have long, flowing black hair, wearing a traditional Thai dress that is elegantly designed with intricate patterns and vibrant colors. She has a warm, inviting smile that embodies the essence of Thai beauty. The male character is dressed in a stylish modern outfit that complements her traditional attire, showcasing a balance of cultural and contemporary styles. Their expressions should convey affection and joy, capturing the essence of love. The setting is a picturesque Thai landscape, featuring lush greenery, ornate temples in the background, and a golden sunset casting a warm glow over the scene. The atmosphere is filled with a sense of romance and tranquility, enhanced by soft, natural lighting that highlights their features. The composition should be a close-up that focuses on their faces, with the rule of thirds applied to create balance. The overall color palette should include warm golden hues and lush greens, promoting a vibrant yet serene mood. The image should be highly detailed, achieving a professional quality similar to an 8k masterpiece, showcasing every aspect of their attire and the beautiful Thai setting around them.'
    },
  ],

  // 头像列表 (Trust 指示器) - 使用 AI Art 图片
  avatars: [
    'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/d3de289da692ecfdacecef173b3dd450.png',
    'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/fd77c2dcd67818f002a294a8bcb3c17a.png',
    'https://cdn.voicica.ai/images/vtEyZ69jh3YfkGlyweAnJR6fhR13/4ea7ad16645cb164712329bdda9b6e64.jpg',
  ],

  // AI Voice 试听
  voiceSample: {
    title: 'AI Voice',
    subtitle: 'Elevenlabs V3',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    coverImage: '', // 使用自定义声波背景
  },

  // AI Music 试听
  musicSample: {
    title: 'AI Music',
    subtitle: 'Epic Cinematic',
    audioUrl: 'https://cdn.voicica.ai/music_audio/7cb88535-0c3f-4c70-924e-0132b97922c9.mp3',
    coverImage: 'https://cdn.voicica.ai/music_covers/7cb88535-0c3f-4c70-924e-0132b97922c9.jpg',
  },

  // Play Store 链接
  playStoreUrl: 'https://play.google.com/store/apps/details?id=ai.voicica.app',

  // Trust 指示器文案
  trustText: 'Trusted by 1M+ creators',
};
