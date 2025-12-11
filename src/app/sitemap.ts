import { MetadataRoute } from 'next';

/**
 * 自动生成 sitemap.xml
 * 访问 https://voicica.ai/sitemap.xml 查看
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://voicica.ai';

  // 支持的语言
  const locales = ['en-US', 'zh-CN', 'zh-TW', 'th-TH'];

  // 主要页面
  const routes = [
    '',           // 首页
    '/studio/tts', // TTS 工具
    '/voices',    // 语音库
    '/pricing',   // 定价
    '/tts',       // TTS 推广页
  ];

  // 为每个页面生成多语言版本
  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    // 主 URL（默认英文）
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : route === '/studio/tts' ? 0.9 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [locale, `${baseUrl}${route}`])
        ),
      },
    });
  });

  return sitemapEntries;
}