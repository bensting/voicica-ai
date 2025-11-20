#!/usr/bin/env node

/**
 * 版本注入脚本
 * 在构建时将版本号注入到应用中
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 注入版本号到环境变量
process.env.NEXT_PUBLIC_APP_VERSION = packageJson.version;

console.log(`✅ 已注入版本号: ${packageJson.version}`);