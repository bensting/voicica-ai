#!/usr/bin/env node

/**
 * GitHub Release 自动化脚本
 *
 * 功能：
 * 1. 读取版本信息
 * 2. 检查 APK/AAB 文件
 * 3. 生成 Release Notes
 * 4. 创建 GitHub Release
 * 5. 上传构建文件
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
      throw err;
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

// 生成 Release Notes
function generateReleaseNotes(version, changelog, fileInfo, testEnv = null) {
  if (testEnv) {
    // 测试版本的 Release Notes
    return `## 🧪 Voicica AI v${version.version} 测试版

> ⚠️ **此版本为内部测试版，仅供测试使用**

### 🔗 测试服务器
- **服务器地址**: ${testEnv.url}
- **环境**: ${testEnv.name}

### 📦 下载信息
- **文件名**: ${path.basename(fileInfo.path)}
- **大小**: ${fileInfo.size}
- **版本**: ${version.version} (Build ${version.buildNumber})
- **构建日期**: ${new Date().toISOString().split('T')[0]}

### 🔐 安全校验
\`\`\`
SHA256: ${fileInfo.sha256}
\`\`\`

### 📥 安装说明
1. 下载 APK 文件
2. 在 Android 设备上，进入 **设置 → 安全**，启用「允许安装未知来源应用」
3. 打开下载的 APK 文件
4. 点击「安装」

### ⚠️ 注意事项
- 此为测试版本，请勿用于生产环境
- 测试完成后请安装正式版本

---
🤖 Generated with [create-github-release.js](https://github.com/benshui08/ai-voice-labs-web)`;
  }

  // 正式版本的 Release Notes
  const notes = `## 📱 Voicica AI v${version.version}

### ✨ 更新内容
${changelog.map(item => `- ${item}`).join('\n')}

### 📦 下载信息
- **文件名**: ${path.basename(fileInfo.path)}
- **大小**: ${fileInfo.size}
- **版本**: ${version.version} (Build ${version.buildNumber})
- **构建日期**: ${new Date().toISOString().split('T')[0]}

### 🔐 安全校验
\`\`\`
SHA256: ${fileInfo.sha256}
\`\`\`

### 📥 安装说明
1. 下载 APK 文件
2. 在 Android 设备上，进入 **设置 → 安全**，启用「允许安装未知来源应用」
3. 打开下载的 APK 文件
4. 点击「安装」

### ⚠️ 注意事项
- 本应用使用远程加载模式，需要网络连接
- 大部分功能更新无需重新下载 APK

---
🤖 Generated with [create-github-release.js](https://github.com/benshui08/ai-voice-labs-web)`;

  return notes;
}

// 测试环境配置
const TEST_ENVIRONMENTS = {
  'test': {
    name: 'ai-voice-labs.com (测试)',
    url: 'https://ai-voice-labs.com',
    apkPattern: 'app-release-ai-voice-labs-v*.apk'
  },
  'staging': {
    name: 'staging (预发布)',
    url: 'https://staging.voicica.ai',
    apkPattern: 'app-release-staging-v*.apk'
  }
};

// 查找测试 APK
function findTestApk(env) {
  const releaseDir = path.join(__dirname, '../android/app/build/outputs/apk/release');

  if (!fs.existsSync(releaseDir)) {
    return null;
  }

  const files = fs.readdirSync(releaseDir);
  const pattern = TEST_ENVIRONMENTS[env]?.apkPattern || `app-release-${env}-v*.apk`;
  const regex = new RegExp(pattern.replace('*', '.*'));

  const apkFile = files.find(f => regex.test(f));
  return apkFile ? path.join(releaseDir, apkFile) : null;
}

// 主流程
async function main() {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');
  const isPrerelease = args.includes('--prerelease');

  // 解析 --test 参数
  const testIndex = args.findIndex(a => a === '--test');
  const testEnvName = testIndex !== -1 ? (args[testIndex + 1] || 'test') : null;
  const isTest = testEnvName !== null;

  log('\n🚀 GitHub Release 自动化工具', colors.cyan + colors.bright);
  log('━'.repeat(60) + '\n', colors.cyan);

  if (isTest) {
    log(`📦 模式: 测试版本 (${testEnvName})`, colors.yellow);
    console.log('');
  }

  // 1. 检查 GitHub CLI
  info('检查 GitHub CLI...');
  try {
    exec('gh --version', { silent: true });
    success('GitHub CLI 已安装');
  } catch {
    error('未安装 GitHub CLI');
    console.log('');
    console.log('请安装 GitHub CLI:');
    console.log('  Windows: winget install GitHub.cli');
    console.log('  macOS: brew install gh');
    console.log('  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md');
    process.exit(1);
  }

  // 检查登录状态
  info('检查 GitHub 登录状态...');
  try {
    exec('gh auth status', { silent: true });
    success('已登录 GitHub');
  } catch {
    error('未登录 GitHub');
    console.log('');
    console.log('请运行: gh auth login');
    process.exit(1);
  }

  // 2. 读取版本信息
  info('读取版本信息...');
  const versionPath = path.join(__dirname, '../native-version.json');

  if (!fs.existsSync(versionPath)) {
    error('未找到 native-version.json');
    process.exit(1);
  }

  const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  success(`版本: v${version.version} (Build ${version.buildNumber})`);

  // 3. 检查 APK 文件
  info('检查 APK 文件...');

  let apkPath;
  let testEnv = null;

  if (isTest) {
    // 查找测试 APK
    apkPath = findTestApk(testEnvName);
    testEnv = TEST_ENVIRONMENTS[testEnvName] || {
      name: testEnvName,
      url: `https://${testEnvName}.voicica.ai`
    };

    if (!apkPath) {
      error(`未找到测试 APK (${testEnvName})`);
      console.log('');
      console.log('请先构建测试 APK:');
      console.log(`  npm run android:build:test`);
      console.log('');
      console.log('或手动指定环境:');
      console.log(`  CAPACITOR_SERVER_URL=https://your-url.com npm run android:build`);
      process.exit(1);
    }
  } else {
    // 正式版本 APK
    apkPath = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');
  }

  if (!fs.existsSync(apkPath)) {
    error('未找到 APK 文件');
    console.log('');
    console.log('请先构建 APK:');
    console.log('  npm run android:build');
    process.exit(1);
  }

  const stats = fs.statSync(apkPath);
  const sha256 = calculateSHA256(apkPath);
  const fileInfo = {
    path: apkPath,
    size: formatFileSize(stats.size),
    sha256: sha256
  };

  success(`找到 APK: ${path.basename(apkPath)} (${fileInfo.size})`);
  info(`SHA256: ${sha256.substring(0, 16)}...`);

  // 4. 检查是否已存在该版本的 Release
  const tagName = isTest ? `v${version.version}-${testEnvName}` : `v${version.version}`;
  info(`检查 Release ${tagName} 是否已存在...`);

  const existingRelease = exec(`gh release view ${tagName} 2>&1`, { silent: true, ignoreError: true });

  if (existingRelease && !existingRelease.includes('release not found')) {
    warning(`Release ${tagName} 已存在，自动删除并重新发布...`);

    // 自动删除现有 Release
    exec(`gh release delete ${tagName} --yes`, { silent: true, ignoreError: true });
    success(`已删除旧版本 ${tagName}`);
  } else {
    success(`${tagName} 可用`);
  }

  // 5. 生成 Release Notes
  info('生成 Release Notes...');
  const changelog = version.changelog?.[0]?.changes || ['版本更新'];
  const releaseNotes = generateReleaseNotes(version, changelog, fileInfo, testEnv);

  // 6. 创建 Release
  info('创建 GitHub Release...');

  // 将 release notes 写入临时文件
  const notesPath = path.join(__dirname, '../.release-notes.md');
  fs.writeFileSync(notesPath, releaseNotes);

  try {
    const releaseTitle = isTest
      ? `Voicica AI ${tagName} 测试版 (${testEnv.name})`
      : `Voicica AI ${tagName}`;

    let command = `gh release create ${tagName} "${apkPath}" --title "${releaseTitle}" --notes-file "${notesPath}"`;

    if (isDraft) {
      command += ' --draft';
    }
    // 测试版本自动添加 prerelease 标记
    if (isPrerelease || isTest) {
      command += ' --prerelease';
    }

    const result = exec(command, { silent: true });

    // 删除临时文件
    fs.unlinkSync(notesPath);

    success('GitHub Release 创建成功！');
    console.log('');
    log('🎉 发布完成！', colors.bright);
    console.log('');
    console.log(`📍 Release URL: https://github.com/benshui08/ai-voice-labs-web/releases/tag/${tagName}`);
    console.log('');

    // 保存发布记录
    const releaseRecord = {
      version: version.version,
      buildNumber: version.buildNumber,
      tag: tagName,
      releaseDate: new Date().toISOString(),
      sha256: sha256,
      size: stats.size,
      isTest: isTest,
      testEnv: testEnvName
    };

    const releasesLogPath = path.join(__dirname, '../.releases.json');
    let releasesLog = [];

    if (fs.existsSync(releasesLogPath)) {
      releasesLog = JSON.parse(fs.readFileSync(releasesLogPath, 'utf8'));
    }

    releasesLog.push(releaseRecord);
    fs.writeFileSync(releasesLogPath, JSON.stringify(releasesLog, null, 2));
    info('发布记录已保存到 .releases.json');

  } catch (err) {
    // 删除临时文件
    if (fs.existsSync(notesPath)) {
      fs.unlinkSync(notesPath);
    }

    error('创建 Release 失败');
    console.error(err.message);
    process.exit(1);
  }
}

// 运行
main().catch(err => {
  error('发生错误:');
  console.error(err);
  process.exit(1);
});