@echo off
REM Android 签名密钥生成脚本
REM 使用方法：双击运行此文件

echo ========================================
echo   Android 签名密钥生成工具
echo ========================================
echo.
echo 重要提醒：
echo 1. 请准备一个强密码（建议使用密码管理器生成）
echo 2. 请准备你的组织信息（公司名称等）
echo 3. 密钥生成后请立即备份！
echo.
pause

cd /d "%~dp0.."

echo.
echo 正在生成签名密钥...
echo 文件位置：%CD%\android-release.keystore
echo.

keytool -genkey -v ^
  -keystore android-release.keystore ^
  -alias voicica-key ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000 ^
  -dname "CN=Voicica AI, OU=Development Team, O=Voicica, L=Unknown, ST=Unknown, C=US"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   密钥生成成功！
    echo ========================================
    echo.
    echo 密钥文件：android-release.keystore
    echo 密钥别名：voicica-key
    echo.
    echo 下一步：
    echo 1. 立即备份密钥文件（参考 KEYSTORE_BACKUP.md）
    echo 2. 配置 .env.local 文件
    echo 3. 运行 npm run android:build 测试构建
    echo.
) else (
    echo.
    echo ========================================
    echo   密钥生成失败！
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 未安装 Java JDK
    echo 2. keytool 未在 PATH 中
    echo.
    echo 请检查 Java 是否安装：java -version
    echo.
)

pause
