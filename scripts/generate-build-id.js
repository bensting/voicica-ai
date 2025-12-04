/**
 * 生成构建 ID 文件
 *
 * 在构建时运行，生成 /public/build-info.json
 * 用于客户端检测版本更新
 */
const fs = require('fs');
const path = require('path');

const buildInfo = {
  buildId: Date.now().toString(36), // 使用时间戳的36进制作为构建ID
  buildTime: new Date().toISOString(),
  version: require('../package.json').version,
};

const outputPath = path.join(__dirname, '../public/build-info.json');

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('✅ Build info generated:', buildInfo);