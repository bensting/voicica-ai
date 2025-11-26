/**
 * 生成 App 图标脚本
 * 将 SVG 图标转换为 Capacitor 需要的各种尺寸 PNG
 *
 * 使用方法: node scripts/generate-app-icons.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 源 SVG 文件
  sourceSvg: path.join(__dirname, '../public/icon.svg'),
  // 输出目录
  outputDir: path.join(__dirname, '../resources'),
  // 品牌颜色
  brandColor: '#9333ea',
};

// 创建一个更大的 SVG 用于高清渲染
function createHighResSvg(originalSvg, size) {
  // 替换 viewBox 但保持内容
  return originalSvg.replace(
    'viewBox="0 0 50 50"',
    `viewBox="0 0 50 50" width="${size}" height="${size}"`
  );
}

// 创建启动画面 SVG（带品牌色背景的居中图标）
function createSplashSvg(iconSvg, size, iconSize) {
  const iconOffset = (size - iconSize) / 2;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- 背景 -->
    <rect width="${size}" height="${size}" fill="${CONFIG.brandColor}"/>
    <!-- 居中的图标 -->
    <g transform="translate(${iconOffset}, ${iconOffset})">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 50 50">
        ${iconSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
      </svg>
    </g>
  </svg>`;
}

// 创建仅图标 SVG（移除背景）
function createIconOnlySvg(originalSvg, size) {
  // 移除背景 rect，只保留麦克风图案
  const withoutBg = originalSvg
    .replace(/<rect[^>]*fill="url\(#bgGrad\)"[^>]*\/>/, '')
    // 将白色改为品牌紫色
    .replace(/fill="white"/g, `fill="${CONFIG.brandColor}"`)
    .replace(/stroke="white"/g, `stroke="${CONFIG.brandColor}"`);

  return withoutBg.replace(
    'viewBox="0 0 50 50"',
    `viewBox="0 0 50 50" width="${size}" height="${size}"`
  );
}

// 创建前景图标（透明背景，白色图案）
function createForegroundSvg(originalSvg, size) {
  // 移除背景，保持白色图案
  const withoutBg = originalSvg.replace(
    /<rect[^>]*fill="url\(#bgGrad\)"[^>]*\/>/,
    ''
  );

  return withoutBg.replace(
    'viewBox="0 0 50 50"',
    `viewBox="0 0 50 50" width="${size}" height="${size}"`
  );
}

async function generateIcons() {
  console.log('🎨 开始生成 App 图标...\n');

  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`📁 创建目录: ${CONFIG.outputDir}`);
  }

  // 读取源 SVG
  const originalSvg = fs.readFileSync(CONFIG.sourceSvg, 'utf-8');
  console.log(`📄 读取源文件: ${CONFIG.sourceSvg}`);

  try {
    // 1. 生成主图标 (icon-only.png) - 1024x1024
    console.log('\n📱 生成主图标...');
    const iconSvg = createHighResSvg(originalSvg, 1024);
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(CONFIG.outputDir, 'icon-only.png'));
    console.log('  ✅ icon-only.png (1024x1024)');

    // 2. 生成前景图标 (icon-foreground.png) - 用于 Android 自适应图标
    console.log('\n🤖 生成 Android 前景图标...');
    const foregroundSvg = createForegroundSvg(originalSvg, 1024);
    await sharp(Buffer.from(foregroundSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(CONFIG.outputDir, 'icon-foreground.png'));
    console.log('  ✅ icon-foreground.png (1024x1024)');

    // 3. 生成背景图标 (icon-background.png) - 纯色背景
    console.log('\n🎨 生成背景图...');
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 147, g: 51, b: 234, alpha: 1 }, // #9333ea
      },
    })
      .png()
      .toFile(path.join(CONFIG.outputDir, 'icon-background.png'));
    console.log('  ✅ icon-background.png (1024x1024)');

    // 4. 生成启动画面 (splash.png) - 2732x2732
    console.log('\n🚀 生成启动画面...');
    const splashSvg = createSplashSvg(originalSvg, 2732, 512);
    await sharp(Buffer.from(splashSvg))
      .resize(2732, 2732)
      .png()
      .toFile(path.join(CONFIG.outputDir, 'splash.png'));
    console.log('  ✅ splash.png (2732x2732)');

    // 5. 生成深色启动画面 (splash-dark.png) - 可选
    console.log('\n🌙 生成深色启动画面...');
    const splashDarkSvg = createSplashSvg(originalSvg, 2732, 512).replace(
      `fill="${CONFIG.brandColor}"`,
      'fill="#1a1a2e"'
    );
    await sharp(Buffer.from(splashDarkSvg))
      .resize(2732, 2732)
      .png()
      .toFile(path.join(CONFIG.outputDir, 'splash-dark.png'));
    console.log('  ✅ splash-dark.png (2732x2732)');

    console.log('\n✨ 图标生成完成！');
    console.log('\n下一步:');
    console.log('  1. 运行 npm run cap:assets 生成各平台图标');
    console.log('  2. 运行 npm run cap:sync 同步到原生项目');
  } catch (error) {
    console.error('\n❌ 生成图标失败:', error.message);
    process.exit(1);
  }
}

generateIcons();