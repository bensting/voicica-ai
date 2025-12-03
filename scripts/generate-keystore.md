# Android 签名密钥生成指南

## ⚠️ 重要提醒

**这个密钥文件非常重要！**
- 用于签名你的 Android 应用
- 丢失后永远无法更新已发布的应用
- 必须妥善备份（建议多地备份）

---

## 📝 生成步骤

### 1. 在项目根目录执行以下命令

```bash
keytool -genkey -v -keystore android-release.keystore -alias voicica-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 按提示输入信息

系统会依次询问：

```
输入密钥库口令: [输入密码，建议使用密码管理器生成]
再次输入新口令: [再次输入相同密码]

您的名字与姓氏是什么?
  [名字]: Voicica AI
您的组织单位名称是什么?
  [组织单位]: Development Team
您的组织名称是什么?
  [组织]: Voicica
您所在的城市或区域名称是什么?
  [城市]:
您所在的省/市/自治区名称是什么?
  [省]:
该单位的双字母国家/地区代码是什么?
  [国家代码]: US

CN=Voicica AI, OU=Development Team, O=Voicica, L=Unknown, ST=Unknown, C=US是否正确?
  [否]: y

输入 <voicica-key> 的密钥口令
        (如果和密钥库口令相同, 按回车): [可以直接回车使用相同密码]
```

### 3. 保存密码信息

**立即记录以下信息**（保存到密码管理器）：

```
密钥库文件: android-release.keystore
密钥库密码 (storePassword): [你刚才输入的密码]
密钥别名 (keyAlias): voicica-key
密钥密码 (keyPassword): [你刚才输入的密码]
```

---

## ✅ 验证密钥已创建

执行以下命令查看密钥信息：

```bash
keytool -list -v -keystore android-release.keystore
```

如果看到类似输出，说明创建成功：

```
密钥库类型: PKCS12
密钥库提供方: SUN

您的密钥库包含 1 个条目

别名: voicica-key
创建日期: 2024-12-03
...
```

---

## 🔒 安全提示

1. **立即备份密钥文件**
   - 复制 `android-release.keystore` 到安全的地方
   - 推荐备份位置：
     - 云盘（加密）
     - 密码管理器（1Password, Bitwarden）
     - U盘（多个副本）

2. **不要提交到 Git**
   - 已添加到 `.gitignore`
   - 永远不要将密钥文件提交到代码仓库

3. **密码管理**
   - 使用强密码
   - 保存到密码管理器
   - 不要忘记密码！

---

## 📍 下一步

生成密钥后，继续配置：
1. 在项目根目录创建 `.env.local` 文件
2. 添加密码配置（参考 `.env.example`）
3. 运行 `npm run build:android` 测试构建

---

## 🆘 常见问题

### Q: keytool 命令找不到？
A: 需要安装 Java JDK，keytool 随 JDK 一起安装。

```bash
# 检查 Java 是否安装
java -version

# 如未安装，下载 JDK:
# https://adoptium.net/
```

### Q: 我忘记密码了怎么办？
A: 无法找回！必须重新生成密钥，但这意味着：
   - 无法更新已发布的应用
   - 必须使用新的包名重新上架

### Q: 密钥有效期过了怎么办？
A: 我们设置了 10000 天（约 27 年），不用担心过期。

---

**准备好了吗？** 在项目根目录执行上面的 keytool 命令吧！