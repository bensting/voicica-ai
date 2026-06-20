import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { readFileSync } from 'fs';
import { join } from 'path';

// 初始化 Cloudflare 绑定（开发环境下让 getCloudflareContext() 可用）
initOpenNextCloudflareForDev();

// 读取版本号
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);
const APP_VERSION = packageJson.version;

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },

  images: {
    unoptimized: true,
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
      {
        protocol: 'https',
        hostname: 'pub-f697d01a99f445de9534dbc9eef1ae37.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'public-platform.r2.fish.audio',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.voicica.ai',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async redirects() {
    return [
      {
        source: '/studio/tools/tiktok-downloader',
        destination: '/native/tools/video-downloader',
        permanent: true,
      },
      {
        source: '/studio/tools/youtube-downloader',
        destination: '/native/tools/video-downloader',
        permanent: true,
      },
    ];
  },

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

export default nextConfig;
