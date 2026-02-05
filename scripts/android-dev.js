/**
 * Android 本地开发脚本
 *
 * 自动配置 Android 连接到本地开发服务器
 * 使用方法: npm run android:dev
 */

const { execSync, spawn } = require('child_process');
const os = require('os');

// 获取本机局域网 IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const port = 3000;
const serverUrl = `http://${localIP}:${port}/native`;

console.log('');
console.log('🚀 Android 本地开发模式');
console.log('─────────────────────────────────────');
console.log(`📱 本机 IP: ${localIP}`);
console.log(`🌐 服务器 URL: ${serverUrl}`);
console.log('─────────────────────────────────────');
console.log('');

// 设置环境变量
process.env.CAPACITOR_SERVER_URL = serverUrl;

// 同步 Capacitor 配置到 Android
console.log('📦 正在同步 Capacitor 配置到 Android...');
try {
  execSync('npx cap sync android', {
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_SERVER_URL: serverUrl }
  });
  console.log('');
  console.log('✅ Android 配置已更新！');
  console.log('');
  console.log('📋 下一步：');
  console.log('   1. 确保 Next.js 开发服务器正在运行: npm run dev');
  console.log('   2. 在 Android Studio 中点击 Run 按钮');
  console.log('   3. 确保手机/模拟器与电脑在同一局域网');
  console.log('');
  console.log(`💡 提示: 如果连接失败，检查防火墙是否允许端口 ${port}`);
  console.log('');
} catch (error) {
  console.error('❌ 同步失败:', error.message);
  process.exit(1);
}
