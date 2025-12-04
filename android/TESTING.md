# Android 真机测试指南

## 前置条件

### 1. 手机端设置

#### 开启开发者选项
1. 打开 **设置** → **关于手机**
2. 连续点击 **版本号** 7次
3. 看到提示"您已进入开发者模式"

#### 开启 USB 调试
1. 返回 **设置** → **开发者选项**
2. 打开 **USB 调试**

### 2. 连接电脑
1. 用 USB 数据线连接手机和电脑
2. 手机弹出"允许 USB 调试吗？"
3. 勾选"始终允许" → 点击"确定"

### 3. 验证连接

```bash
# Windows
C:/Users/ADMIN/AppData/Local/Android/Sdk/platform-tools/adb.exe devices

# macOS / Linux
adb devices
```

成功输出示例：
```
List of devices attached
R5CTB2A3KZP     device    ← 你的手机
emulator-5554   device    ← 模拟器（可选）
```

## 构建测试包

### 方法一：命令行（推荐）

```bash
# 进入 android 目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# APK 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法二：Android Studio

1. 打开 Android Studio
2. 菜单 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 构建完成后点击通知中的 **locate** 查看 APK

## 安装到手机

### 方法一：ADB 命令安装

```bash
# 查看已连接设备
adb devices

# 安装到指定设备（替换 DEVICE_ID 为你的设备 ID）
adb -s DEVICE_ID install app/build/outputs/apk/debug/app-debug.apk

# 如果只有一个设备，可以省略 -s 参数
adb install app/build/outputs/apk/debug/app-debug.apk

# 覆盖安装（保留数据）
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 方法二：一键构建并安装

```bash
cd android
./gradlew installDebug
```

### 方法三：Android Studio

1. 选择目标设备（工具栏设备下拉菜单）
2. 点击 **Run** 按钮（绿色三角形）

## 常见问题

### 设备未显示

| 问题 | 解决方案 |
|------|----------|
| 手机没出现在列表 | 检查 USB 线是否支持数据传输（有些线只能充电） |
| 显示 `unauthorized` | 手机上点击"允许 USB 调试" |
| 显示 `offline` | 重新插拔 USB 或重启 ADB：`adb kill-server && adb start-server` |

### 安装失败

| 错误 | 解决方案 |
|------|----------|
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | 签名不匹配，需先卸载旧版本 |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | 手机存储空间不足 |
| `INSTALL_FAILED_USER_RESTRICTED` | 开发者选项中开启"USB 安装" |

### 卸载旧版本

```bash
# 命令行卸载
adb uninstall ai.voicica.app

# 如果命令行卸载失败，手动卸载：
# 设置 → 应用 → Voicica AI → 卸载
```

## 查看日志

```bash
# 查看应用日志
adb logcat | grep -i voicica

# 只看 Capacitor 日志
adb logcat | grep -i capacitor

# 保存日志到文件
adb logcat > debug.log
```

## 快速命令参考

```bash
# 完整流程：同步 → 构建 → 安装
npx cap sync android && cd android && ./gradlew installDebug

# 仅重新安装（不重新构建）
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 启动应用
adb shell am start -n ai.voicica.app/.MainActivity

# 强制停止应用
adb shell am force-stop ai.voicica.app

# 清除应用数据
adb shell pm clear ai.voicica.app
```

## 屏幕镜像 (scrcpy)

将手机屏幕实时显示在电脑上，方便调试和演示。

### 安装 scrcpy

```powershell
# Windows (使用 winget)
winget install Genymobile.scrcpy

# macOS (使用 Homebrew)
brew install scrcpy

# Linux (Ubuntu/Debian)
sudo apt install scrcpy
```

### 基本使用

```powershell
# 启动屏幕镜像（自动检测设备）
scrcpy

# 指定设备（多设备时使用）
scrcpy -s DEVICE_ID

# 示例
scrcpy -s R5CTB2A3KZP
```

### 常用参数

```powershell
# 限制分辨率（更流畅）
scrcpy --max-size 1024

# 限制码率（降低延迟）
scrcpy --bit-rate 2M

# 自定义窗口标题
scrcpy --window-title "My Phone"

# 录制屏幕
scrcpy --record video.mp4

# 只镜像不控制（只读模式）
scrcpy --no-control

# 关闭手机屏幕（省电）
scrcpy --turn-screen-off

# 保持唤醒
scrcpy --stay-awake

# 组合使用
scrcpy --max-size 1024 --bit-rate 2M --stay-awake
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + C` | 复制 |
| `Ctrl + V` | 粘贴 |
| `Ctrl + Shift + V` | 粘贴为按键事件 |
| `右键` | 返回 |
| `中键` | Home |
| `Ctrl + B` | 返回 |
| `Ctrl + H` | Home |
| `Ctrl + S` | 多任务 |
| `Ctrl + O` | 关闭手机屏幕 |
| `Ctrl + R` | 旋转屏幕 |
| `Ctrl + N` | 展开通知栏 |
| `Ctrl + Shift + N` | 收起通知栏 |

### 特点

- 无需在手机上安装任何 APP
- 低延迟，高帧率
- 支持鼠标和键盘控制手机
- 支持复制粘贴（电脑 ↔ 手机）
- 支持录屏
- 开源免费