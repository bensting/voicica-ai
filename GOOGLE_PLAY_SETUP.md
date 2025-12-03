# Google Play 自动发布配置指南

本文档介绍如何配置 Google Play API，实现自动上传 AAB 到 Google Play Console。

---

## 📋 前提条件

1. ✅ 已有 Google Play Developer 账号（$25 一次性注册费）
2. ✅ 已在 Google Play Console 创建应用
3. ✅ 已构建 AAB 文件（`npm run android:build:aab`）

---

## 🔧 配置步骤

### 步骤 1：创建 Google Cloud Project

1. **访问 Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **创建新项目**
   - 点击顶部项目选择器
   - 点击「新建项目」
   - 项目名称：`Voicica AI - Play Publishing`
   - 点击「创建」

3. **启用 Google Play Android Developer API**
   - 在搜索框输入：`Google Play Android Developer API`
   - 点击「启用」按钮

---

### 步骤 2：创建服务账号

1. **进入 IAM & Admin**
   ```
   左侧菜单 → IAM & Admin → Service Accounts
   ```

2. **创建服务账号**
   - 点击「+ CREATE SERVICE ACCOUNT」
   - **服务账号名称**：`google-play-publisher`
   - **服务账号 ID**：自动生成（例如：`google-play-publisher@voicica-ai.iam.gserviceaccount.com`）
   - 点击「CREATE AND CONTINUE」

3. **授予权限**（可选，跳过）
   - 点击「CONTINUE」

4. **创建密钥**
   - 点击「+ CREATE KEY」
   - 选择「JSON」格式
   - 点击「CREATE」
   - **JSON 文件会自动下载到你的电脑**

5. **重命名并移动文件**
   ```bash
   # 将下载的 JSON 文件重命名为：
   google-play-service-account.json

   # 移动到项目根目录：
   mv ~/Downloads/voicica-ai-xxxxx.json ./google-play-service-account.json
   ```

---

### 步骤 3：在 Google Play Console 授权服务账号

1. **访问 Google Play Console**
   ```
   https://play.google.com/console/
   ```

2. **进入 API 访问设置**
   ```
   左侧菜单 → 设置 → API 访问
   ```

3. **关联 Google Cloud Project**
   - 如果未关联，点击「关联」按钮
   - 选择刚创建的项目：`Voicica AI - Play Publishing`
   - 点击「关联项目」

4. **授予服务账号权限**
   - 在「服务账号」列表中找到：`google-play-publisher@...`
   - 点击「授予访问权限」
   - 选择以下权限：
     - ✅ **查看应用信息和下载批量报告（只读）**
     - ✅ **管理生产版本**
     - ✅ **管理测试轨道版本**
   - 点击「应用」
   - 点击「邀请用户」

5. **确认授权**
   - 服务账号状态应显示为「有效」

---

## ✅ 验证配置

运行以下命令测试配置：

```bash
# 1. 检查服务账号文件是否存在
ls google-play-service-account.json

# 2. 构建 AAB（如果还没有）
npm run android:build:aab

# 3. 测试上传到内部测试轨道
npm run android:publish:internal
```

如果成功，你会看到：
```
✅ 已连接到 Google Play API
✅ 编辑会话创建成功
✅ AAB 上传成功！
✅ 已分配到内部测试轨道
✅ 已提交到 Google Play
🎉 上传完成！
```

---

## 📦 使用方法

### ⚠️ 重要：首次发布 vs 后续更新

**首次发布（必须手动）**：
- ❌ API 无法完成首次发布的所有步骤
- ✅ 必须在 Google Play Console 网页上手动完成以下内容：
  1. 应用基本信息（名称、描述等）
  2. 应用图标和功能图形
  3. 截图（至少 2 张，最多 8 张）
  4. 隐私政策
  5. 内容分级
  6. 数据安全表单
  7. 完整的商店详情

**后续更新（可自动化）**：
- ✅ 上传新版本 AAB
- ✅ 更新版本说明
- ✅ 发布到不同轨道

### 首次发布流程（手动）

见下方「首次发布完整指南」章节

### 后续更新流程（自动）

```bash
# 内部测试（推荐先用这个测试）
npm run android:publish:internal

# Beta 测试
npm run android:publish:beta

# 生产环境
npm run android:publish
```

### 完整发布流程

```bash
# 1. 更新原生版本号
# 编辑 native-version.json，修改 version 和 buildNumber

# 2. 同步版本号
npm run native:version:sync

# 3. 构建 AAB
npm run android:build:aab

# 4. 上传到 Google Play（内部测试）
npm run android:publish:internal

# 5. 测试通过后，发布到生产环境
npm run android:publish
```

---

## 🔐 安全最佳实践

### 1. 保护服务账号 JSON

```bash
# ✅ 已自动添加到 .gitignore
google-play-service-account.json

# ⚠️ 永远不要提交到 Git
# ⚠️ 不要分享给他人
# ⚠️ 定期轮换密钥
```

### 2. 备份服务账号

```bash
# 备份到安全的地方（加密云存储）
# 推荐使用：
# - 1Password
# - Bitwarden
# - 加密的 USB 驱动器
```

### 3. CI/CD 环境变量

如果使用 GitHub Actions 或其他 CI/CD：

```yaml
# .github/workflows/android-release.yml
env:
  GOOGLE_PLAY_SERVICE_ACCOUNT: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}

steps:
  - name: Create service account file
    run: echo "$GOOGLE_PLAY_SERVICE_ACCOUNT" > google-play-service-account.json
```

在 GitHub Secrets 中添加 `GOOGLE_PLAY_SERVICE_ACCOUNT`（JSON 文件的完整内容）。

---

## 🚨 常见问题

### 问题 1：`applicationNotFound` 错误

**原因**：应用未在 Google Play Console 创建

**解决**：
1. 访问 https://play.google.com/console/
2. 点击「创建应用」
3. 填写应用信息（名称、语言、类型等）
4. 完成初始设置

---

### 问题 2：`403 Forbidden` 错误

**原因**：服务账号没有权限

**解决**：
1. 检查 Google Play Console → 设置 → API 访问
2. 确认服务账号已授权且状态为「有效」
3. 确认权限包含「管理生产版本」和「管理测试轨道版本」

---

### 问题 3：`Invalid JWT` 错误

**原因**：服务账号 JSON 文件无效或损坏

**解决**：
1. 重新下载 JSON 文件
2. 确认文件名为 `google-play-service-account.json`
3. 确认文件在项目根目录

---

### 问题 4：上传超时

**原因**：AAB 文件太大或网络问题

**解决**：
1. 检查 AAB 文件大小（应该 < 150MB）
2. 使用稳定的网络连接
3. 重试上传

---

## 📚 相关资源

- [Google Play Developer API 文档](https://developers.google.com/android-publisher)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Play Console](https://play.google.com/console/)
- [服务账号最佳实践](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)

---

## 💡 提示

- ✅ 建议先上传到「内部测试」轨道验证
- ✅ 测试通过后再发布到「生产环境」
- ✅ 定期备份服务账号 JSON 文件
- ✅ 使用版本管理跟踪每次发布

---

## 📱 首次发布完整指南

### 需要准备的资源

#### 1. 应用图标和图形资源

| 资源 | 尺寸 | 格式 | 必需 | 说明 |
|------|------|------|------|------|
| **应用图标** | 512×512 px | PNG (32-bit) | ✅ 必需 | 背景透明或纯色 |
| **功能图形** | 1024×500 px | PNG/JPEG | ✅ 必需 | 用于商店顶部横幅 |
| **手机截图** | 至少 2 张 | PNG/JPEG | ✅ 必需 | 最多 8 张 |
| **7 英寸平板截图** | 至少 2 张 | PNG/JPEG | ⭕ 可选 | 如果支持平板 |
| **10 英寸平板截图** | 至少 2 张 | PNG/JPEG | ⭕ 可选 | 如果支持平板 |
| **宣传图片** | 180×120 px | PNG/JPEG | ⭕ 可选 | 用于推广 |
| **电视横幅** | 1280×720 px | PNG/JPEG | ⭕ 可选 | 如果支持 TV |

**截图尺寸要求**：
- 手机：最小 320px，最大 3840px
- 推荐：1080×1920 px 或 1440×2560 px

#### 2. 应用文本内容

```yaml
应用名称: "Voicica AI"
  最多 30 个字符

简短描述: "AI 驱动的语音合成工具"
  最多 80 个字符

完整描述: |
  Voicica AI 是一款强大的 AI 语音合成应用，让您轻松将文字转换为自然流畅的语音。

  ✨ 主要功能：
  • 多种语音模型选择
  • 支持多语言合成
  • 高质量音频输出
  • 语音克隆功能
  • 实时预览

  🎯 适用场景：
  • 内容创作
  • 有声读物制作
  • 语音助手开发
  • 无障碍辅助

  最多 4000 个字符
```

#### 3. 其他必需信息

- **隐私政策 URL**：必需（可以托管在你的网站）
- **开发者联系邮箱**：必需
- **应用类别**：生产力 / 娱乐 / 工具
- **内容分级**：需要填写问卷

---

### 首次发布步骤

#### 步骤 1：创建应用

1. **访问 Google Play Console**
   ```
   https://play.google.com/console/
   ```

2. **创建应用**
   - 点击「创建应用」
   - **应用名称**：Voicica AI
   - **默认语言**：中文（简体）或 English (US)
   - **应用类型**：应用
   - **免费或付费**：免费
   - 勾选声明和同意条款
   - 点击「创建应用」

---

#### 步骤 2：设置商店详情

1. **进入「主商店详情」**
   ```
   左侧菜单 → 展示 → 主商店详情
   ```

2. **填写应用信息**
   - **应用名称**：Voicica AI
   - **简短描述**：AI 驱动的语音合成工具（80 字符内）
   - **完整描述**：详细介绍应用功能（4000 字符内）

3. **上传图形资源**
   - **应用图标**（512×512）：拖入文件或从项目使用
     ```
     项目中的图标位置：android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
     需要调整为 512×512 尺寸
     ```
   - **功能图形**（1024×500）：设计横幅图
   - **手机截图**：至少 2 张应用截图

4. **应用类别**
   - **应用类别**：选择合适的分类（如「工具」）
   - **标签**：添加相关标签（如「语音」「AI」）

5. **联系信息**
   - **网站**：https://voicica.ai
   - **电子邮件**：your-email@example.com
   - **电话**（可选）

6. **隐私政策**
   - **隐私政策 URL**：https://voicica.ai/privacy-policy

7. **保存草稿**

---

#### 步骤 3：内容分级

1. **进入「内容分级」**
   ```
   左侧菜单 → 政策 → 应用内容 → 内容分级
   ```

2. **填写问卷**
   - 选择应用类别
   - 回答关于暴力、性、粗俗语言等内容的问题
   - 对于语音合成应用，大多数答案应该是「否」

3. **提交并获取分级**
   - 提交后会自动获得各地区的内容分级

---

#### 步骤 4：数据安全

1. **进入「数据安全」**
   ```
   左侧菜单 → 政策 → 应用内容 → 数据安全
   ```

2. **填写数据收集和安全表单**
   - **是否收集用户数据**：根据实际情况
   - **数据类型**：列出收集的数据类型
   - **数据用途**：说明数据使用目的
   - **数据安全措施**：说明加密和安全措施

---

#### 步骤 5：目标受众

1. **进入「目标受众和内容」**
   ```
   左侧菜单 → 政策 → 应用内容 → 目标受众和内容
   ```

2. **选择目标年龄组**
   - 选择应用面向的年龄段
   - 对于工具类应用，通常选择「18 岁及以上」

---

#### 步骤 6：上传 AAB（首次）

**选项 A：使用 API 上传**（推荐，但需要先完成上述步骤）
```bash
# 构建 AAB
npm run android:build:aab

# 上传到内部测试
npm run android:publish:internal
```

**选项 B：手动上传**
1. **进入「内部测试」**
   ```
   左侧菜单 → 测试 → 内部测试
   ```

2. **创建版本**
   - 点击「创建新版本」
   - 上传 AAB：`android/app/build/outputs/bundle/release/app-release.aab`
   - 填写版本说明
   - 点击「保存」

3. **添加测试人员**
   - 创建测试人员列表
   - 添加邮箱地址
   - 保存

4. **开始推出**
   - 审核信息
   - 点击「开始推出到内部测试」

---

#### 步骤 7：等待审核

**内部测试**：
- ✅ 审核时间：几分钟到几小时
- ✅ 测试人员可以立即下载

**生产发布**：
- ⏰ 审核时间：2-7 天
- 📝 可能需要额外信息或修改

---

### 快速准备清单

在开始之前，确保准备好：

```
□ 应用图标（512×512 PNG）
□ 功能图形（1024×500 PNG/JPEG）
□ 至少 2 张截图（1080×1920 推荐）
□ 简短描述（80 字符）
□ 完整描述（最多 4000 字符）
□ 隐私政策页面 URL
□ 联系邮箱
□ AAB 文件已构建
□ Google Play Developer 账号（$25）
□ 已配置服务账号 JSON（用于后续自动化）
```

---

### 截图制作技巧

#### 使用 Chrome DevTools 模拟设备
```bash
1. 在浏览器打开：https://voicica.ai
2. F12 打开开发者工具
3. Ctrl+Shift+M 切换到设备模拟
4. 选择设备：Pixel 5 (1080×2340)
5. 截图：Ctrl+Shift+P → "Capture screenshot"
6. 使用图片编辑器裁剪为 1080×1920
```

#### 使用 Android 模拟器
```bash
# 启动模拟器
npm run cap:run:android

# 在应用中截图
# 使用 Android Studio 的 "Logcat" 旁边的截图按钮
```

#### 在线工具
- **App Mockup Generator**: https://mockuphone.com/
- **Canva**: 添加背景和文字说明
- **Figma**: 专业设计工具

---

### 功能图形设计建议

**尺寸**：1024×500 px

**内容建议**：
- 应用 Logo + 标语
- 核心功能展示
- 品牌色彩一致
- 简洁明了

**工具**：
- Canva（模板丰富）
- Adobe Photoshop
- Figma

---

## 🎯 完整发布时间线

```
第 1 天：准备资源
  ├─ 设计图标和功能图形
  ├─ 制作截图
  └─ 撰写应用描述

第 2-3 天：创建应用并填写信息
  ├─ 在 Google Play Console 创建应用
  ├─ 填写商店详情
  ├─ 完成内容分级问卷
  ├─ 填写数据安全表单
  └─ 设置目标受众

第 3 天：首次上传
  ├─ 构建 AAB
  ├─ 上传到内部测试
  └─ 添加测试人员

第 4-5 天：内部测试
  ├─ 测试人员下载测试
  ├─ 收集反馈
  └─ 修复 Bug

第 6 天：提交审核
  └─ 提交到生产轨道

第 7-14 天：审核中
  ├─ Google 审核（2-7 天）
  └─ 可能需要补充信息

第 14 天后：上架成功
  └─ 应用在 Google Play 上线
```

---

## 💰 费用说明

- **Google Play Developer 账号**：$25（一次性，终身有效）
- **应用发布**：免费
- **应用内购买**：Google 抽成 15-30%
- **订阅**：首年 15%，之后 15%

---

最后更新：2025-12-03