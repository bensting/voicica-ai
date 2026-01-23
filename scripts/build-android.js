#!/usr/bin/env node

/**
 * Android 自动化构建脚本
 *
 * 功能：
 * 1. 检查环境配置
 * 2. 同步原生版本号
 * 3. 同步 Capacitor 资源
 * 4. 构建签名 APK/AAB
 * 5. 生成校验和
 * 6. 输出构建信息
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.cyan + colors.bright);
  console.log('='.repeat(60) + '\n');
}

// 执行命令
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (err) {
    if (!options.ignoreError) {
      error(`命令执行失败: ${command}`);
      error(err.message);
      process.exit(1);
    }
    return null;
  }
}

// 计算文件 SHA256
function calculateSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 主流程
async function main() {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'apk'; // apk 或 aab
  const skipSync = args.includes('--skip-sync'); // 跳过 cap sync（从测试脚本调用时）

  log('\n🚀 Android 自动化构建工具', colors.cyan + colors.bright);
  log('━'.repeat(60) + '\n', colors.cyan);

  // 1. 检查环境
  section('步骤 1/5: 环境检查');

  // 检查 Java
  info('检查 Java 环境...');
  const javaVersion = exec('java -version 2>&1', { silent: true, ignoreError: true });
  if (javaVersion && javaVersion.includes('version')) {
    success('Java 已安装');
  } else {
    error('未检测到 Java，请安装 JDK');
    process.exit(1);
  }

  // 检查密钥配置
  info('检查签名密钥配置...');
  if (!process.env.ANDROID_KEYSTORE_PASSWORD) {
    warning('环境变量未设置，尝试从 .env.local 读取...');

    const envLocalPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const passwordMatch = envContent.match(/ANDROID_KEYSTORE_PASSWORD=(.+)/);

      if (passwordMatch) {
        process.env.ANDROID_KEYSTORE_PASSWORD = passwordMatch[1].trim();
        process.env.ANDROID_KEY_PASSWORD = passwordMatch[1].trim();
        process.env.ANDROID_KEY_ALIAS = 'voicica-key';
        success('已从 .env.local 读取密钥配置');
      } else {
        error('未找到签名密钥配置，请检查 .env.local');
        process.exit(1);
      }
    } else {
      error('.env.local 文件不存在');
      process.exit(1);
    }
  } else {
    success('签名密钥配置已就绪');
  }

  // 2. 自动递增版本号并同步
  section('步骤 2/5: 更新并同步版本号');

  // 读取版本信息
  const versionPath = path.join(__dirname, '../src/native-version.json');
  const nativeVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

  // 递增 patch 版本号 (1.0.6 → 1.0.7)
  const oldVersion = nativeVersion.version;
  const versionParts = oldVersion.split('.');
  versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
  nativeVersion.version = versionParts.join('.');

  // 保存更新后的版本信息
  fs.writeFileSync(versionPath, JSON.stringify(nativeVersion, null, 2));
  info(`版本号自动递增: ${oldVersion} → ${nativeVersion.version}`);

  // 同步到 Android/iOS 项目
  info('同步版本号到 Android...');
  exec('node scripts/sync-native-version.js');
  success(`当前版本: ${nativeVersion.version} (Build ${nativeVersion.buildNumber})`);

  // 3. 同步 Capacitor
  section('步骤 3/5: 同步 Capacitor 插件');

  if (skipSync) {
    // 从测试脚本调用，已经同步过配置，跳过避免覆盖
    info('跳过 Capacitor 同步（配置已由调用方同步）');
    success('使用现有 Capacitor 配置');
  } else {
    info('同步 Capacitor 插件到 Android 项目...');

    // 检查是否使用远程模式（读取 TypeScript 配置文件）
    const capacitorConfigPath = path.join(__dirname, '../capacitor.config.ts');
    const capacitorConfigContent = fs.readFileSync(capacitorConfigPath, 'utf8');

    // 检测是否配置了 server.url（远程加载模式）
    const hasRemoteServer = capacitorConfigContent.includes('server:') &&
                            (capacitorConfigContent.includes('process.env.CAPACITOR_SERVER_URL') ||
                             capacitorConfigContent.includes('https://'));

    if (hasRemoteServer) {
      info('检测到远程加载模式（WebView 加载线上网页）');
      info('同步 Capacitor 配置（不同步 Web 资源）...');

      // 远程模式：同步配置和插件，跳过 Web 资源构建
      // cap sync 会同步 capacitor.config.json 到 Android 项目
      exec('npx cap sync android', { ignoreError: true });
    } else {
      // 本地模式，需要同步 Web 资源
      info('本地模式：同步 Web 资源到原生项目...');
      exec('npx cap sync android');
    }

    success('Capacitor 同步完成');
  }

  // 4. 构建
  section('步骤 4/5: 构建 Android 应用');

  const isWindows = process.platform === 'win32';
  const androidDir = path.join(__dirname, '../android');
  const gradlewPath = isWindows
    ? path.join(androidDir, 'gradlew.bat')
    : path.join(androidDir, 'gradlew');

  const gradleTask = buildType === 'aab' ? 'bundleRelease' : 'assembleRelease';

  if (buildType === 'aab') {
    info('构建 AAB (Android App Bundle) - 用于 Google Play...');
  } else {
    info('构建 APK - 用于直接分发...');
  }

  // 在 android 目录下执行 Gradle
  const gradleCommand = isWindows
    ? `cmd /c "gradlew.bat ${gradleTask}"`
    : `./gradlew ${gradleTask}`;

  exec(gradleCommand, {
    cwd: androidDir,
    env: {
      ...process.env,
      // 确保 Gradle 能找到签名配置
      ANDROID_KEYSTORE_PASSWORD: process.env.ANDROID_KEYSTORE_PASSWORD,
      ANDROID_KEY_PASSWORD: process.env.ANDROID_KEY_PASSWORD,
      ANDROID_KEY_ALIAS: process.env.ANDROID_KEY_ALIAS,
    }
  });

  success('构建完成！');

  // 5. 输出信息
  section('步骤 5/5: 构建结果');

  const outputDir = buildType === 'aab'
    ? path.join(__dirname, '../android/app/build/outputs/bundle/release')
    : path.join(__dirname, '../android/app/build/outputs/apk/release');

  const outputFile = buildType === 'aab'
    ? path.join(outputDir, 'app-release.aab')
    : path.join(outputDir, 'app-release.apk');

  if (fs.existsSync(outputFile)) {
    // 重命名为带版本号的文件名
    const ext = buildType === 'aab' ? 'aab' : 'apk';
    const newFileName = `app-release-${nativeVersion.version}.${ext}`;
    const newFilePath = path.join(outputDir, newFileName);

    // 如果目标文件已存在，先删除
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }
    fs.renameSync(outputFile, newFilePath);

    const stats = fs.statSync(newFilePath);
    const sha256 = calculateSHA256(newFilePath);

    console.log('');
    success('构建成功！');
    console.log('');
    log('📦 文件信息:', colors.bright);
    console.log(`   文件：${newFilePath}`);
    console.log(`   大小：${formatFileSize(stats.size)}`);
    console.log(`   SHA256：${sha256}`);
    console.log('');

    // 保存构建信息
    const buildInfo = {
      version: nativeVersion.version,
      buildNumber: nativeVersion.buildNumber,
      buildType: buildType.toUpperCase(),
      buildDate: new Date().toISOString(),
      file: newFilePath,
      size: stats.size,
      sha256: sha256
    };

    const buildInfoPath = path.join(outputDir, 'build-info.json');
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    info(`构建信息已保存: ${buildInfoPath}`);

    console.log('');
    log('📋 下一步:', colors.bright);
    if (buildType === 'aab') {
      console.log('   1. 登录 Google Play Console');
      console.log('   2. 上传 AAB 文件');
      console.log('   3. 提交审核');
    } else {
      console.log('   1. 上传 APK 到 GitHub Releases 或你的服务器');
      console.log('   2. 在下载页面提供 SHA256 校验和');
      console.log('   3. 提供用户安装说明');
    }
    console.log('');

  } else {
    error('未找到构建输出文件');
    error(`预期位置: ${outputFile}`);
    process.exit(1);
  }
}

// 运行
main().catch(err => {
  error('构建过程出错:');
  console.error(err);
  process.exit(1);
});