/**
 * 修复 capacitor-assets 生成后的 PWA 图标路径
 * 1. 移动 icons/ 到 public/icons/
 * 2. 修复 manifest.json 中的路径
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS_SRC = path.join(ROOT, 'icons');
const ICONS_DEST = path.join(ROOT, 'public', 'icons');
const MANIFEST_PATH = path.join(ROOT, 'public', 'manifest.json');

// 1. 移动 icons 文件夹
if (fs.existsSync(ICONS_SRC)) {
  // 删除旧的 public/icons
  if (fs.existsSync(ICONS_DEST)) {
    fs.rmSync(ICONS_DEST, { recursive: true, force: true });
    console.log('✅ 删除旧的 public/icons');
  }

  // 移动新的 icons 到 public/icons
  fs.renameSync(ICONS_SRC, ICONS_DEST);
  console.log('✅ 移动 icons → public/icons');
}

// 2. 修复 manifest.json 路径
if (fs.existsSync(MANIFEST_PATH)) {
  let manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');

  // 修复图标路径: ../icons/ → /icons/
  manifest = manifest.replace(/"src":\s*"\.\.\/icons\//g, '"src": "/icons/');

  // 修复 MIME 类型: image/png → image/webp (对于 webp 文件)
  manifest = manifest.replace(/"type":\s*"image\/png"/g, '"type": "image/webp"');

  fs.writeFileSync(MANIFEST_PATH, manifest, 'utf-8');
  console.log('✅ 修复 manifest.json 路径');
}

console.log('🎉 PWA 图标处理完成');
