// 首页展示素材配置
// 修改此文件即可更换所有首页素材

export const HOME_SHOWCASE_CONFIG = {
  // 背景图
  backgroundImage: '/images/home/hero-bg.png',

  // 左侧 AI Art 样图
  artworks: [
    { id: 1, src: '/images/home/art-1.jpg', alt: 'AI Art 1' },
    { id: 2, src: '/images/home/art-2.jpg', alt: 'AI Art 2' },
    { id: 3, src: '/images/home/art-3.jpg', alt: 'AI Art 3' },
  ],

  // 头像列表 (Trust 指示器)
  avatars: [
    '/images/home/avatar-1.png',
    '/images/home/avatar-2.png',
    '/images/home/avatar-3.png',
  ],

  // AI Voice 试听
  voiceSample: {
    title: 'AI Voice',
    subtitle: 'Morgan Freeman Style',
    audioUrl: '/audio/voice-sample.mp3',
    coverImage: '/images/home/voice-cover.jpg',
  },

  // AI Music 试听
  musicSample: {
    title: 'AI Music',
    subtitle: 'Epic Cinematic',
    audioUrl: '/audio/music-sample.mp3',
    coverImage: '/images/home/music-cover.jpg',
  },

  // Play Store 链接
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.voicica.app',

  // Trust 指示器文案
  trustText: 'Trusted by 10,000+ creators',
};
