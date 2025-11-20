#!/usr/bin/env node

/**
 * 版本同步脚本
 * 从 package.json 读取版本号并同步到 manifest.json
 * 确保整个应用版本号的一致性
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

  console.log(`📦 当前版本: ${version}`);

  // 读取 manifest.json
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

  // 检查版本是否需要更新
  if (manifestJson.version === version) {
    console.log('✅ manifest.json 版本已是最新');
  } else {
    // 更新版本号
    manifestJson.version = version;

    // 写回 manifest.json
    fs.writeFileSync(
      manifestJsonPath,
      JSON.stringify(manifestJson, null, 2) + '\n',
      'utf8'
    );

    console.log(`✅ 已更新 manifest.json 版本: ${manifestJson.version} -> ${version}`);
  }

  // 可选: 同步到环境变量文件
  const envExamplePath = path.join(__dirname, '../.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_APP_VERSION')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_APP_VERSION=.*/,
        `NEXT_PUBLIC_APP_VERSION=${version}`
      );
      fs.writeFileSync(envExamplePath, envContent, 'utf8');
      console.log('✅ 已更新 .env.example 版本号');
    }
  }

  console.log('🎉 版本同步完成！');
  process.exit(0);
} catch (error) {
  console.error('❌ 版本同步失败:', error.message);
  process.exit(1);
}