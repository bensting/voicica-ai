#!/usr/bin/env node

/**
 * 原生应用版本同步脚本
 * 从 native-version.json 读取版本号并同步到:
 * - android/app/build.gradle (Android)
 * - ios/App/App.xcodeproj/project.pbxproj (iOS)
 *
 * 使用场景：当原生功能变化需要重新打包时更新版本号
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const nativeVersionPath = path.join(__dirname, '../native-version.json');
const androidBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');
const iosProjectPath = path.join(__dirname, '../ios/App/App.xcodeproj/project.pbxproj');

/**
 * 将语义化版本号转换为 Android versionCode
 * 格式: major * 10000 + minor * 100 + patch
 * 例如: 1.0.0 -> 10000, 1.2.3 -> 10203
 */
function versionToCode(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

/**
 * 更新 Android build.gradle 中的版本号
 */
function updateAndroidVersion(version, buildNumber) {
  if (!fs.existsSync(androidBuildGradlePath)) {
    console.log('⚠️  未找到 android/app/build.gradle，跳过 Android 版本同步');
    return false;
  }

  try {
    const versionCode = buildNumber || versionToCode(version);
    let buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf8');

    // 检查是否需要更新
    const currentVersionName = buildGradleContent.match(/versionName\s+"([^"]+)"/)?.[1];
    const currentVersionCode = buildGradleContent.match(/versionCode\s+(\d+)/)?.[1];

    if (currentVersionName === version && currentVersionCode === String(versionCode)) {
      console.log('✅ Android 版本已是最新');
      console.log(`   - versionName: "${version}"`);
      console.log(`   - versionCode: ${versionCode}`);
      return false;
    }

    // 更新 versionCode
    buildGradleContent = buildGradleContent.replace(
      /versionCode\s+\d+/,
      `versionCode ${versionCode}`
    );

    // 更新 versionName
    buildGradleContent = buildGradleContent.replace(
      /versionName\s+"[^"]+"/,
      `versionName "${version}"`
    );

    // 写回文件
    fs.writeFileSync(androidBuildGradlePath, buildGradleContent, 'utf8');

    console.log(`✅ 已更新 Android 版本:`);
    console.log(`   - versionName: "${currentVersionName}" -> "${version}"`);
    console.log(`   - versionCode: ${currentVersionCode} -> ${versionCode}`);

    return true;
  } catch (error) {
    console.error('❌ 更新 Android 版本失败:', error.message);
    return false;
  }
}

/**
 * 更新 iOS project.pbxproj 中的版本号
 */
function updateIOSVersion(version, buildNumber) {
  if (!fs.existsSync(iosProjectPath)) {
    console.log('⚠️  未找到 iOS project.pbxproj，跳过 iOS 版本同步');
    return false;
  }

  try {
    let projectContent = fs.readFileSync(iosProjectPath, 'utf8');

    // 检查当前版本
    const currentMarketingVersion = projectContent.match(/MARKETING_VERSION\s*=\s*([^;]+);/)?.[1]?.trim();
    const currentProjectVersion = projectContent.match(/CURRENT_PROJECT_VERSION\s*=\s*([^;]+);/)?.[1]?.trim();

    if (currentMarketingVersion === version && currentProjectVersion === String(buildNumber)) {
      console.log('✅ iOS 版本已是最新');
      console.log(`   - MARKETING_VERSION: ${version}`);
      console.log(`   - CURRENT_PROJECT_VERSION: ${buildNumber}`);
      return false;
    }

    // 更新 MARKETING_VERSION (显示给用户的版本号)
    projectContent = projectContent.replace(
      /MARKETING_VERSION\s*=\s*[^;]+;/g,
      `MARKETING_VERSION = ${version};`
    );

    // 更新 CURRENT_PROJECT_VERSION (构建号)
    projectContent = projectContent.replace(
      /CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${buildNumber};`
    );

    // 写回文件
    fs.writeFileSync(iosProjectPath, projectContent, 'utf8');

    console.log(`✅ 已更新 iOS 版本:`);
    console.log(`   - MARKETING_VERSION: ${currentMarketingVersion} -> ${version}`);
    console.log(`   - CURRENT_PROJECT_VERSION: ${currentProjectVersion} -> ${buildNumber}`);

    return true;
  } catch (error) {
    console.error('❌ 更新 iOS 版本失败:', error.message);
    return false;
  }
}

try {
  // 读取 native-version.json
  if (!fs.existsSync(nativeVersionPath)) {
    console.error('❌ 未找到 native-version.json 文件');
    console.error('请先创建该文件或运行: npm run native:version:init');
    process.exit(1);
  }

  const nativeVersion = JSON.parse(fs.readFileSync(nativeVersionPath, 'utf8'));
  const { version, buildNumber } = nativeVersion;

  console.log(`\n📱 原生应用版本: ${version} (Build ${buildNumber})`);
  console.log('─────────────────────────────────────\n');

  let updated = false;

  // 同步到 Android
  const androidUpdated = updateAndroidVersion(version, buildNumber);
  updated = updated || androidUpdated;

  console.log();

  // 同步到 iOS
  const iosUpdated = updateIOSVersion(version, buildNumber);
  updated = updated || iosUpdated;

  console.log('\n─────────────────────────────────────');
  if (updated) {
    console.log('🎉 原生应用版本同步完成！');
    console.log('\n💡 下一步:');
    console.log('   1. 运行 npx cap sync 同步到原生项目');
    console.log('   2. 使用 Android Studio / Xcode 构建应用');
  } else {
    console.log('✨ 所有原生版本号均已是最新！');
  }
  console.log('\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ 原生版本同步失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}