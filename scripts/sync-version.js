#!/usr/bin/env node

/**
 * Web 版本同步脚本
 * 从 package.json 读取版本号并同步到:
 * - manifest.json (PWA)
 * - .env.example (环境变量示例)
 *
 * 注意: 原生应用（Android/iOS）版本使用 sync-native-version.js 管理
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const packageJsonPath = path.join(__dirname, '../package.json');
const manifestJsonPath = path.join(__dirname, '../public/manifest.json');

try {
  // 读取 package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  console.log(`\n📦 Web 应用版本: ${version}`);
  console.log('─────────────────────────────────────\n');

  let updated = false;

  // 1. 同步到 manifest.json
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  if (manifestJson.version === version) {
    console.log('✅ PWA manifest.json 版本已是最新');
  } else {
    manifestJson.version = version;
    fs.writeFileSync(
      manifestJsonPath,
      JSON.stringify(manifestJson, null, 2) + '\n',
      'utf8'
    );
    console.log(`✅ 已更新 PWA manifest.json 版本`);
    updated = true;
  }

  // 2. 同步到环境变量文件
  const envExamplePath = path.join(__dirname, '../.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_APP_VERSION')) {
      const oldVersion = envContent.match(/NEXT_PUBLIC_APP_VERSION=(.*)/)?.[1];
      if (oldVersion !== version) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_APP_VERSION=.*/,
          `NEXT_PUBLIC_APP_VERSION=${version}`
        );
        fs.writeFileSync(envExamplePath, envContent, 'utf8');
        console.log('✅ 已更新 .env.example 版本号');
        updated = true;
      } else {
        console.log('✅ .env.example 版本号已是最新');
      }
    }
  }

  console.log('\n─────────────────────────────────────');
  if (updated) {
    console.log('🎉 Web 版本同步完成！');
    console.log('\n💡 提示: 原生应用版本请使用 npm run native:version:sync');
  } else {
    console.log('✨ 所有 Web 版本号均已是最新！');
  }
  console.log('\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ 版本同步失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}