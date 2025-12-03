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
function generateReleaseNotes(version, changelog, fileInfo) {
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

// 主流程
async function main() {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');
  const isPrerelease = args.includes('--prerelease');

  log('\n🚀 GitHub Release 自动化工具', colors.cyan + colors.bright);
  log('━'.repeat(60) + '\n', colors.cyan);

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
  const apkPath = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');

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

  success(`找到 APK: ${fileInfo.size}`);
  info(`SHA256: ${sha256.substring(0, 16)}...`);

  // 4. 检查是否已存在该版本的 Release
  const tagName = `v${version.version}`;
  info(`检查 Release ${tagName} 是否已存在...`);

  const existingRelease = exec(`gh release view ${tagName} 2>&1`, { silent: true, ignoreError: true });

  if (existingRelease && !existingRelease.includes('release not found')) {
    warning(`Release ${tagName} 已存在`);
    console.log('');
    console.log('选项:');
    console.log(`  1. 删除现有 Release: gh release delete ${tagName}`);
    console.log(`  2. 更新版本号后重新运行`);
    console.log(`  3. 手动上传文件: gh release upload ${tagName} "${apkPath}"`);
    process.exit(1);
  }

  success(`${tagName} 可用`);

  // 5. 生成 Release Notes
  info('生成 Release Notes...');
  const changelog = version.changelog || ['版本更新'];
  const releaseNotes = generateReleaseNotes(version, changelog, fileInfo);

  // 6. 创建 Release
  info('创建 GitHub Release...');

  // 将 release notes 写入临时文件
  const notesPath = path.join(__dirname, '../.release-notes.md');
  fs.writeFileSync(notesPath, releaseNotes);

  try {
    let command = `gh release create ${tagName} "${apkPath}" --title "Voicica AI ${tagName}" --notes-file "${notesPath}"`;

    if (isDraft) {
      command += ' --draft';
    }
    if (isPrerelease) {
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
      size: stats.size
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