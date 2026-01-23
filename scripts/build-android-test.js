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
  'test': 'https://www.ai-voice-labs.com/studio',
  'staging': 'https://staging.voicica.ai/studio',
  'production': 'https://www.voicica.ai/studio',
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

  // 1. 先运行生产构建（和生产完全一样的流程）
  info('运行标准构建流程...');
  console.log('');

  try {
    execSync('node scripts/build-android.js apk', { stdio: 'inherit' });
  } catch (err) {
    error('APK 构建失败');
    process.exit(1);
  }

  // 2. 构建完成后，修改 APK 中的配置并重新打包
  // 但这太复杂了，改用更简单的方式：
  // 直接修改配置文件，然后只运行 Gradle 构建（不运行 cap sync）

  info('修改配置为测试环境并重新构建...');
  const capacitorConfigPath = path.join(__dirname, '../android/app/src/main/assets/capacitor.config.json');

  if (fs.existsSync(capacitorConfigPath)) {
    const config = JSON.parse(fs.readFileSync(capacitorConfigPath, 'utf8'));
    const originalUrl = config.server?.url || 'unknown';

    // 只修改 URL（其他配置保持和生产一样）
    config.server.url = targetUrl;

    // 修改 allowNavigation
    const baseDomains = [
      'stripe.com', '*.stripe.com',
      'google.com', '*.google.com', 'accounts.google.com', '*.googleapis.com',
      '*.firebaseapp.com', '*.firebase.com', '*.firebaseio.com',
      'apple.com', '*.apple.com', 'appleid.apple.com',
      'twitter.com', '*.twitter.com', 'x.com', '*.x.com',
    ];

    if (targetUrl.includes('ai-voice-labs.com')) {
      config.server.allowNavigation = ['ai-voice-labs.com', '*.ai-voice-labs.com', ...baseDomains];
    } else if (targetUrl.includes('voicica.ai')) {
      config.server.allowNavigation = ['voicica.ai', '*.voicica.ai', ...baseDomains];
    }

    fs.writeFileSync(capacitorConfigPath, JSON.stringify(config, null, '\t'));
    success(`配置已修改: ${originalUrl} → ${targetUrl}`);
  }

  // 3. 读取签名配置
  if (!process.env.ANDROID_KEYSTORE_PASSWORD) {
    const envLocalPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const passwordMatch = envContent.match(/ANDROID_KEYSTORE_PASSWORD=(.+)/);
      if (passwordMatch) {
        process.env.ANDROID_KEYSTORE_PASSWORD = passwordMatch[1].trim();
        process.env.ANDROID_KEY_PASSWORD = passwordMatch[1].trim();
        process.env.ANDROID_KEY_ALIAS = 'voicica-key';
      }
    }
  }

  // 4. 只运行 Gradle 重新打包（不运行 cap sync，配置已修改）
  info('重新打包 APK...');
  const isWindows = process.platform === 'win32';
  const androidDir = path.join(__dirname, '../android');
  const gradleCommand = isWindows ? 'cmd /c "gradlew.bat assembleRelease"' : './gradlew assembleRelease';

  try {
    execSync(gradleCommand, {
      cwd: androidDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ANDROID_KEYSTORE_PASSWORD: process.env.ANDROID_KEYSTORE_PASSWORD,
        ANDROID_KEY_PASSWORD: process.env.ANDROID_KEY_PASSWORD,
        ANDROID_KEY_ALIAS: process.env.ANDROID_KEY_ALIAS,
      }
    });
    success('重新打包完成');
  } catch (err) {
    error('Gradle 构建失败');
    process.exit(1);
  }

  // 4. 重命名为测试包文件名
  const apkDir = path.join(__dirname, '../android/app/build/outputs/apk/release');
  const versionPath = path.join(__dirname, '../src/native-version.json');
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

  // Gradle 输出的是 app-release.apk
  const gradleOutputApk = path.join(apkDir, 'app-release.apk');
  const testApkName = `app-release-test-${version.version}.apk`;
  const testApkPath = path.join(apkDir, testApkName);

  if (fs.existsSync(gradleOutputApk)) {
    // 如果目标文件已存在，先删除
    if (fs.existsSync(testApkPath)) {
      fs.unlinkSync(testApkPath);
    }
    fs.renameSync(gradleOutputApk, testApkPath);

    console.log('');
    log('📦 构建结果:', colors.bright);
    console.log(`   APK 文件: ${testApkPath}`);
    console.log(`   目标 URL: ${targetUrl}`);
    console.log(`   版本: ${version.version} (Build ${version.buildNumber})`);
    console.log('');
  } else {
    warning('未找到 Gradle 输出的 APK 文件');
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