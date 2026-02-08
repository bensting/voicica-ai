import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/native/', '/studio/', '/api/', '/settings/', '/login/'],
      },
    ],
    sitemap: 'https://voicica.ai/sitemap.xml',
  };
}
