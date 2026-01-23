#!/usr/bin/env node

/**
 * Google Play 自动上传脚本
 *
 * 功能：
 * 1. 验证 Google Play 服务账号
 * 2. 上传 AAB 到 Google Play Console
 * 3. 分配到指定发布轨道
 * 4. 提交审核
 */

const { google } = require('googleapis');
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

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.cyan + colors.bright);
  console.log('='.repeat(60) + '\n');
}

// 读取 capacitor.config.ts 获取 appId
function getPackageName() {
  const configPath = path.join(__dirname, '../capacitor.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const match = configContent.match(/appId:\s*['"]([^'"]+)['"]/);

  if (!match) {
    throw new Error('无法从 capacitor.config.ts 读取 appId');
  }

  return match[1];
}

// 主流程
async function main() {
  const args = process.argv.slice(2);
  const track = args[0] || 'internal'; // internal, alpha, beta, production

  log('\n🚀 Google Play 自动上传工具', colors.cyan + colors.bright);
  log('━'.repeat(60) + '\n', colors.cyan);

  // 1. 检查服务账号配置
  section('步骤 1/6: 检查配置');

  const serviceAccountPath = path.join(__dirname, '../google-play-service-account.json');

  if (!fs.existsSync(serviceAccountPath)) {
    error('未找到 Google Play 服务账号 JSON 文件');
    console.log('');
    warning('请按以下步骤配置：');
    console.log('');
    console.log('1. 访问 Google Cloud Console:');
    console.log('   https://console.cloud.google.com/');
    console.log('');
    console.log('2. 创建服务账号并下载 JSON 密钥');
    console.log('');
    console.log('3. 将文件命名为 google-play-service-account.json');
    console.log('   并放在项目根目录');
    console.log('');
    console.log('详细步骤请查看：GOOGLE_PLAY_SETUP.md');
    console.log('');
    process.exit(1);
  }

  success('找到服务账号配置文件');

  // 读取 package name
  const packageName = getPackageName();
  info(`应用包名: ${packageName}`);

  // 2. 检查 AAB 文件
  section('步骤 2/6: 检查 AAB 文件');

  const aabPath = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');

  if (!fs.existsSync(aabPath)) {
    error('未找到 AAB 文件');
    console.log('');
    info('请先构建 AAB:');
    console.log('  npm run android:build:aab');
    console.log('');
    process.exit(1);
  }

  const stats = fs.statSync(aabPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  success(`找到 AAB 文件 (${sizeMB} MB)`);

  // 读取版本信息
  const nativeVersion = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/native-version.json'), 'utf8')
  );
  info(`版本: ${nativeVersion.version} (Build ${nativeVersion.buildNumber})`);

  // 3. 初始化 Google API 客户端
  section('步骤 3/6: 连接 Google Play API');

  let androidpublisher;
  let authClient;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    authClient = await auth.getClient();
    androidpublisher = google.androidpublisher({ version: 'v3', auth: authClient });

    success('已连接到 Google Play API');
  } catch (err) {
    error('Google Play API 认证失败');
    console.error(err.message);
    process.exit(1);
  }

  // 4. 创建编辑会话
  section('步骤 4/6: 创建编辑会话');

  let editId;

  try {
    const editResponse = await androidpublisher.edits.insert({
      packageName: packageName,
    });

    editId = editResponse.data.id;
    success(`编辑会话创建成功 (ID: ${editId})`);
  } catch (err) {
    error('创建编辑会话失败');
    console.error(err.message);

    if (err.message.includes('applicationNotFound')) {
      console.log('');
      warning('应用未在 Google Play Console 中创建');
      console.log('');
      console.log('请先手动创建应用：');
      console.log('1. 访问 https://play.google.com/console/');
      console.log('2. 创建应用');
      console.log('3. 完成首次设置');
      console.log('');
    }

    process.exit(1);
  }

  // 5. 上传 AAB
  section('步骤 5/6: 上传 AAB 文件');

  let versionCode;

  try {
    info('正在上传 AAB（可能需要几分钟）...');

    const uploadResponse = await androidpublisher.edits.bundles.upload({
      packageName: packageName,
      editId: editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(aabPath),
      },
    });

    versionCode = uploadResponse.data.versionCode;
    success(`AAB 上传成功！版本代码: ${versionCode}`);
  } catch (err) {
    error('AAB 上传失败');
    console.error(err.message);

    // 删除编辑会话
    try {
      await androidpublisher.edits.delete({
        packageName: packageName,
        editId: editId,
      });
    } catch (e) {
      // 忽略删除错误
    }

    process.exit(1);
  }

  // 6. 分配到发布轨道并提交
  section('步骤 6/6: 分配发布轨道并提交');

  const trackNames = {
    internal: '内部测试',
    alpha: '封闭测试 (Alpha)',
    beta: '开放测试 (Beta)',
    production: '生产环境',
  };

  info(`目标轨道: ${trackNames[track]} (${track})`);

  try {
    // 分配到轨道
    await androidpublisher.edits.tracks.update({
      packageName: packageName,
      editId: editId,
      track: track,
      requestBody: {
        track: track,
        releases: [{
          versionCodes: [versionCode.toString()],
          status: 'completed',
          releaseNotes: [{
            language: 'zh-CN',
            text: nativeVersion.changelog[0] || `版本 ${nativeVersion.version}`,
          }, {
            language: 'en-US',
            text: `Version ${nativeVersion.version}`,
          }],
        }],
      },
    });

    success(`已分配到 ${trackNames[track]} 轨道`);

    // 提交编辑
    await androidpublisher.edits.commit({
      packageName: packageName,
      editId: editId,
    });

    success('已提交到 Google Play');

  } catch (err) {
    error('提交失败');
    console.error(err.message);

    // 删除编辑会话
    try {
      await androidpublisher.edits.delete({
        packageName: packageName,
        editId: editId,
      });
    } catch (e) {
      // 忽略删除错误
    }

    process.exit(1);
  }

  // 完成
  console.log('');
  success('🎉 上传完成！');
  console.log('');
  log('📋 下一步:', colors.bright);

  if (track === 'internal') {
    console.log('1. 访问 Google Play Console');
    console.log('2. 进入「测试 → 内部测试」');
    console.log('3. 添加测试用户');
    console.log('4. 分享测试链接');
  } else if (track === 'alpha' || track === 'beta') {
    console.log('1. 访问 Google Play Console');
    console.log('2. 审核将在几小时内完成');
    console.log('3. 通过后用户可以下载测试');
  } else if (track === 'production') {
    console.log('1. 访问 Google Play Console');
    console.log('2. 审核通常需要 2-7 天');
    console.log('3. 通过后将在 Google Play 上架');
  }

  console.log('');
  console.log(`🔗 Google Play Console: https://play.google.com/console/`);
  console.log('');
}

// 运行
main().catch(err => {
  error('上传过程出错:');
  console.error(err);
  process.exit(1);
});