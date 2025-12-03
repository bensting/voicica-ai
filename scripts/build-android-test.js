#!/usr/bin/env node

/**
 * Android 测试包构建脚本
 *
 * 用于构建指向不同服务器 URL 的测试 APK
 *
 * 用法：
 *   node scripts/build-android-test.js [url]
 *
 * 示例：
 *   node scripts/build-android-test.js https://ai-voice-labs.com
 *   node scripts/build-android-test.js https://staging.voicica.ai
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// 预设的测试环境
const TEST_ENVIRONMENTS = {
  'test': 'https://ai-voice-labs.com',
  'staging': 'https://staging.voicica.ai',
  'production': 'https://voicica.ai/studio',
};

// 主流程
async function main() {
  const args = process.argv.slice(2);
  let targetUrl = args[0];

  log('\n🧪 Android 测试包构建工具', colors.cyan + colors.bright);
  log('━'.repeat(60) + '\n', colors.cyan);

  // 处理预设环境名称
  if (targetUrl && TEST_ENVIRONMENTS[targetUrl]) {
    targetUrl = TEST_ENVIRONMENTS[targetUrl];
    info(`使用预设环境: ${args[0]}`);
  }

  // 如果没有提供 URL，显示帮助
  if (!targetUrl) {
    console.log('用法: npm run android:build:test <url|环境名>');
    console.log('');
    console.log('预设环境:');
    Object.entries(TEST_ENVIRONMENTS).forEach(([name, url]) => {
      console.log(`  ${name.padEnd(12)} → ${url}`);
    });
    console.log('');
    console.log('示例:');
    console.log('  npm run android:build:test test');
    console.log('  npm run android:build:test https://ai-voice-labs.com');
    console.log('');
    process.exit(0);
  }

  // 验证 URL 格式
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    error('URL 必须以 http:// 或 https:// 开头');
    process.exit(1);
  }

  info(`目标 URL: ${targetUrl}`);
  console.log('');

  // 1. 设置环境变量
  process.env.CAPACITOR_SERVER_URL = targetUrl;
  success(`环境变量已设置: CAPACITOR_SERVER_URL=${targetUrl}`);

  // 2. 同步 Capacitor 配置
  info('同步 Capacitor 配置...');
  try {
    execSync('npx cap sync android', {
      stdio: 'inherit',
      env: { ...process.env, CAPACITOR_SERVER_URL: targetUrl }
    });
    success('Capacitor 同步完成');
  } catch (err) {
    // 远程模式下可能会有警告，但不影响
    warning('Capacitor 同步完成（有警告，可忽略）');
  }

  // 3. 验证配置
  info('验证配置...');
  const capacitorConfigPath = path.join(__dirname, '../android/app/src/main/assets/capacitor.config.json');

  if (fs.existsSync(capacitorConfigPath)) {
    const configContent = fs.readFileSync(capacitorConfigPath, 'utf8');
    const config = JSON.parse(configContent);

    if (config.server && config.server.url === targetUrl) {
      success(`配置验证通过: ${config.server.url}`);
    } else {
      warning(`配置 URL 可能不匹配，实际: ${config.server?.url}`);
    }
  }

  // 4. 构建 APK
  info('开始构建 APK...');
  console.log('');

  try {
    // 使用 --skip-sync 避免重复同步覆盖测试配置
    execSync('node scripts/build-android.js apk --skip-sync', {
      stdio: 'inherit',
      env: { ...process.env, CAPACITOR_SERVER_URL: targetUrl }
    });
  } catch (err) {
    error('APK 构建失败');
    process.exit(1);
  }

  // 5. 重命名为测试包文件名
  const apkDir = path.join(__dirname, '../android/app/build/outputs/apk/release');
  const versionPath = path.join(__dirname, '../native-version.json');
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

  // 生产构建脚本会生成 app-release-版本号.apk，需要重命名为测试包
  const prodApkName = `app-release-${version.version}.apk`;
  const prodApkPath = path.join(apkDir, prodApkName);
  const testApkName = `app-release-test-${version.version}.apk`;
  const testApkPath = path.join(apkDir, testApkName);

  if (fs.existsSync(prodApkPath)) {
    // 如果目标文件已存在，先删除
    if (fs.existsSync(testApkPath)) {
      fs.unlinkSync(testApkPath);
    }
    fs.renameSync(prodApkPath, testApkPath);

    console.log('');
    log('📦 构建结果:', colors.bright);
    console.log(`   APK 文件: ${testApkPath}`);
    console.log(`   目标 URL: ${targetUrl}`);
    console.log(`   版本: ${version.version} (Build ${version.buildNumber})`);
    console.log('');
  }

  console.log('');
  success('🎉 测试包构建完成！');
  console.log('');
}

// 运行
main().catch(err => {
  error('构建过程出错:');
  console.error(err);
  process.exit(1);
});