@echo off
chcp 65001 >nul
echo ========================================
echo   Android 打包脚本
echo ========================================
echo.

REM 读取版本信息
for /f "tokens=2 delims=:," %%a in ('type native-version.json ^| findstr /C:"\"version\""') do set "RAW_VERSION=%%a"
for /f "tokens=2 delims=:," %%a in ('type native-version.json ^| findstr /C:"\"buildNumber\""') do set "RAW_BUILD=%%a"
REM 去除引号和空格
set "APP_VERSION=%RAW_VERSION: =%"
set "APP_VERSION=%APP_VERSION:"=%"
set "BUILD_NUMBER=%RAW_BUILD: =%"

echo 当前版本: v%APP_VERSION% (Build %BUILD_NUMBER%)
echo.
echo 请选择打包类型:
echo   1. 测试环境 APK  (ai-voice-labs.com)
echo   2. 生产环境 APK  (voicica.ai) - 独立版本
echo   3. 生产环境 AAB  (voicica.ai) - Google Play
echo.
set /p choice="输入选项 (1/2/3): "

if "%choice%"=="1" (
    set FLAVOR=standalone
    set BUILD_CMD=assembleStandaloneRelease
    set BUILD_OUTPUT=android\app\build\outputs\apk\standalone\release\app-standalone-release.apk
    set FINAL_NAME=voicica-test-%APP_VERSION%-b%BUILD_NUMBER%.apk
    set OUTPUT_NAME=测试 APK
    set SERVER_URL=https://ai-voice-labs.com/studio
    set ENV_NAME=测试环境
) else if "%choice%"=="2" (
    set FLAVOR=standalone
    set BUILD_CMD=assembleStandaloneRelease
    set BUILD_OUTPUT=android\app\build\outputs\apk\standalone\release\app-standalone-release.apk
    set FINAL_NAME=voicica-release-%APP_VERSION%-b%BUILD_NUMBER%.apk
    set OUTPUT_NAME=生产 APK
    set SERVER_URL=https://www.voicica.ai/studio
    set ENV_NAME=生产环境
) else if "%choice%"=="3" (
    set FLAVOR=playStore
    set BUILD_CMD=bundlePlayStoreRelease
    set BUILD_OUTPUT=android\app\build\outputs\bundle\playStoreRelease\app-playStore-release.aab
    set FINAL_NAME=voicica-release-%APP_VERSION%-b%BUILD_NUMBER%.aab
    set OUTPUT_NAME=生产 AAB
    set SERVER_URL=https://www.voicica.ai/studio
    set ENV_NAME=生产环境
) else (
    echo 无效选项，退出
    pause
    exit /b 1
)

echo.
echo 配置信息:
echo   - 环境: %ENV_NAME%
echo   - 服务器: %SERVER_URL%
echo   - 输出: %OUTPUT_NAME%

echo.
echo 正在构建 %OUTPUT_NAME% (%FLAVOR%)...
echo.

echo [1/4] 同步原生版本号...
call npm run native:version:sync
if %errorlevel% neq 0 (
    echo 错误: 版本同步失败
    pause
    exit /b 1
)

echo.
echo [2/4] 构建 Web 资源...
call npm run build
if %errorlevel% neq 0 (
    echo 错误: Web 构建失败
    pause
    exit /b 1
)

echo.
echo [3/4] 同步到 Android 项目...
echo      服务器地址: %SERVER_URL%
set CAPACITOR_SERVER_URL=%SERVER_URL%
call npx cap sync android
if %errorlevel% neq 0 (
    echo 错误: Capacitor 同步失败
    pause
    exit /b 1
)

echo.
echo [4/4] 打包 %OUTPUT_NAME%...
cd android
call gradlew %BUILD_CMD%
if %errorlevel% neq 0 (
    echo 错误: 打包失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/5] 复制并重命名输出文件...
set OUTPUT_DIR=build-output
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%
copy /Y "%BUILD_OUTPUT%" "%OUTPUT_DIR%\%FINAL_NAME%"
if %errorlevel% neq 0 (
    echo 错误: 文件复制失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包完成!
echo ========================================
echo.
echo 构建信息:
echo   - 环境: %ENV_NAME%
echo   - 服务器: %SERVER_URL%
echo   - 类型: %OUTPUT_NAME%
echo.
echo 文件位置:
echo   %CD%\%OUTPUT_DIR%\%FINAL_NAME%
echo.
echo 原始位置:
echo   %BUILD_OUTPUT%
echo.
pause