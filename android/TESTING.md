# Android 真机测试指南

## 目录

1. [前置条件](#前置条件)
2. [连接方式](#连接方式)
   - [USB 连接](#usb-连接)
   - [无线连接](#无线连接)
3. [构建与安装](#构建与安装)
4. [查看日志](#查看日志)
5. [屏幕镜像](#屏幕镜像-scrcpy)
6. [常见问题](#常见问题)
7. [快速命令参考](#快速命令参考)

---

## 前置条件

### 手机端设置

#### 1. 开启开发者选项
1. 打开 **设置** → **关于手机**
2. 连续点击 **版本号** 7 次
3. 看到提示"您已进入开发者模式"

#### 2. 开启 USB 调试
1. 返回 **设置** → **开发者选项**
2. 打开 **USB 调试**
3. （可选）打开 **无线调试** - 用于无线连接

---

## 连接方式

### USB 连接

#### 步骤
1. 用 USB 数据线连接手机和电脑
2. 手机弹出"允许 USB 调试吗？"
3. 勾选"始终允许" → 点击"确定"

#### 验证连接

```powershell
adb devices
```

成功输出：
```
List of devices attached
R5CTB2A3KZP     device    ← 你的手机
```

---

### 无线连接

无线连接可以摆脱 USB 线的束缚，方便调试。

#### 方法一：通过 USB 初始化（推荐）

```powershell
# 1. 先用 USB 连接，获取手机 IP
adb shell ip addr show wlan0 | findstr "inet "
# 输出示例：inet 192.168.1.100/24 ...

# 2. 开启 TCP 模式
adb tcpip 5555

# 3. 无线连接（可以拔掉 USB 了）
adb connect 192.168.1.100:5555
```

#### 方法二：Android 11+ 无线调试

1. 手机：**设置** → **开发者选项** → **无线调试** → 开启
2. 点击 **使用配对码配对设备**
3. 电脑执行：
```powershell
adb pair 192.168.1.100:xxxxx
# 输入手机上显示的配对码
```
4. 配对成功后连接：
```powershell
adb connect 192.168.1.100:5555
```

#### 验证无线连接

```powershell
adb devices
```

成功输出：
```
List of devices attached
192.168.1.100:5555    device    ← 无线连接
```

#### 断开与重连

```powershell
# 断开连接
adb disconnect 192.168.1.100:5555

# 重新连接（下次使用时）
adb connect 192.168.1.100:5555
```

> **注意**：手机重启后需要重新用 USB 初始化无线连接

---

## 构建与安装

### 构建 Debug APK

#### 方法一：命令行（推荐）

```powershell
cd android
./gradlew assembleDebug
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 方法二：Android Studio

1. 菜单 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. 构建完成后点击通知中的 **locate** 查看 APK

### 安装到手机

#### 方法一：一键构建并安装

```powershell
cd android
./gradlew installDebug
```

#### 方法二：ADB 安装

```powershell
# 安装（自动检测设备）
adb install app/build/outputs/apk/debug/app-debug.apk

# 指定设备安装
adb -s 192.168.1.100:5555 install app/build/outputs/apk/debug/app-debug.apk

# 覆盖安装（保留数据）
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### 方法三：Android Studio

1. 选择目标设备（工具栏设备下拉菜单）
2. 点击 **Run** 按钮

### 卸载应用

```powershell
# 命令行卸载
adb uninstall ai.voicica.app

# 如果失败，手动卸载：设置 → 应用 → Voicica AI → 卸载
```

---

## 查看日志

### 基本用法

```powershell
# 查看所有日志（实时）
adb logcat

# 指定设备（无线连接时）
adb -s 192.168.1.100:5555 logcat
```

### 过滤日志

#### Windows PowerShell

```powershell
# 只看 Capacitor 日志
adb logcat -s "Capacitor/Console:*"

# 过滤关键词
adb logcat | Select-String -Pattern "voicica|Capacitor|FirebaseAuth"

# 多关键词过滤
adb logcat | Select-String -Pattern "error|exception" -CaseSensitive:$false
```

#### macOS / Linux

```bash
# 只看 Capacitor 日志
adb logcat -s "Capacitor/Console:*"

# 过滤关键词
adb logcat | grep -iE "voicica|capacitor|firebase"
```

### 常用日志命令

```powershell
# 清除旧日志后查看
adb logcat -c && adb logcat

# 保存日志到文件
adb logcat > debug.log

# 只看错误和警告
adb logcat *:W

# 查看应用崩溃日志
adb logcat --pid=$(adb shell pidof ai.voicica.app)
```

### 日志级别

| 级别 | 说明 |
|------|------|
| `V` | Verbose（最详细） |
| `D` | Debug |
| `I` | Info |
| `W` | Warning |
| `E` | Error |
| `F` | Fatal |

```powershell
# 只显示 Warning 及以上级别
adb logcat *:W

# 只显示 Error 及以上级别
adb logcat *:E
```

---

## 屏幕镜像 (scrcpy)

将手机屏幕实时显示在电脑上，支持鼠标键盘控制。

### 安装

```powershell
# Windows
winget install Genymobile.scrcpy

# macOS
brew install scrcpy

# Linux
sudo apt install scrcpy
```

### 基本使用

```powershell
# USB 连接
scrcpy

# 无线连接
scrcpy -s 192.168.1.100:5555

# 指定设备
scrcpy -s R5CTB2A3KZP
```

### 推荐配置

```powershell
# USB 连接（高画质）
scrcpy --max-size 1920

# 无线连接（优化流畅度）
scrcpy -s 192.168.1.100:5555 --bit-rate 2M --max-size 1024

# 演示模式（保持唤醒 + 窗口置顶）
scrcpy --stay-awake --always-on-top --window-title "Voicica Demo"
```

### 常用参数

| 参数 | 说明 |
|------|------|
| `--max-size 1024` | 限制分辨率（更流畅） |
| `--bit-rate 2M` | 限制码率（降低延迟） |
| `--window-title "标题"` | 自定义窗口标题 |
| `--record video.mp4` | 录制屏幕 |
| `--no-control` | 只镜像不控制 |
| `--turn-screen-off` | 关闭手机屏幕（省电） |
| `--stay-awake` | 保持唤醒 |
| `--always-on-top` | 窗口置顶 |

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `右键 / Ctrl+B` | 返回 |
| `中键 / Ctrl+H` | Home |
| `Ctrl+S` | 多任务 |
| `Ctrl+O` | 关闭手机屏幕 |
| `Ctrl+R` | 旋转屏幕 |
| `Ctrl+N` | 展开通知栏 |
| `Ctrl+Shift+N` | 收起通知栏 |
| `Ctrl+C / Ctrl+V` | 复制 / 粘贴 |

---

## 常见问题

### 设备连接问题

| 问题 | 解决方案 |
|------|----------|
| 设备未显示 | 检查 USB 线是否支持数据传输 |
| 显示 `unauthorized` | 手机上点击"允许 USB 调试" |
| 显示 `offline` | 重启 ADB：`adb kill-server && adb start-server` |
| 无线连接失败 | 确保手机和电脑在同一 WiFi |

### 安装失败

| 错误 | 解决方案 |
|------|----------|
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | 签名不匹配，先卸载旧版本 |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | 手机存储空间不足 |
| `INSTALL_FAILED_USER_RESTRICTED` | 开发者选项中开启"USB 安装" |

### ADB 命令找不到

```powershell
# 使用完整路径
C:/Users/ADMIN/AppData/Local/Android/Sdk/platform-tools/adb.exe devices

# 或添加到环境变量 PATH
```

---

## 快速命令参考

### 完整测试流程

```powershell
# 1. 同步 Capacitor
npx cap sync android

# 2. 构建并安装
cd android && ./gradlew installDebug

# 3. 查看日志
adb logcat -s "Capacitor/Console:*"
```

### 常用命令速查

```powershell
# 查看设备
adb devices

# 无线连接
adb tcpip 5555
adb connect 192.168.1.100:5555

# 安装 APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 卸载应用
adb uninstall ai.voicica.app

# 启动应用
adb shell am start -n ai.voicica.app/.MainActivity

# 停止应用
adb shell am force-stop ai.voicica.app

# 清除数据
adb shell pm clear ai.voicica.app

# 屏幕镜像
scrcpy

# 查看日志
adb logcat -s "Capacitor/Console:*"
```