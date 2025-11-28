import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from 'next-pwa';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取版本号
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);
const APP_VERSION = packageJson.version;

const nextConfig: NextConfig = {
  /* config options here */

  // 禁用尾部斜杠重定向（避免 Stripe webhook 307 错误）
  skipTrailingSlashRedirect: true,

  // 环境变量注入
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },

  // 配置外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-dc353f0aede3432493780267c47faff7.r2.dev',
        pathname: '/**',
      },
    ],
    // 允许 SVG 图片（用于 DiceBear 头像）
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 修复 Firebase Auth 的 COOP 警告
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

// 配置 PWA
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: false,  // 改为 false,让新 Service Worker 等待
  disable: process.env.NODE_ENV === 'development',
  // 自定义 Service Worker 配置
  buildExcludes: [/middleware-manifest\.json$/, /_buildManifest\.js$/],
  // 添加版本控制
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})(nextConfig);
