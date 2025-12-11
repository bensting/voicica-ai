@echo off
chcp 65001 >nul
echo ========================================
echo   Android 打包脚本
echo ========================================
echo.
echo 请选择打包类型:
echo   1. Google Play (AAB) - 无 APK 安装权限
echo   2. 独立版本 (APK) - 含自动更新功能
echo.
set /p choice="输入选项 (1 或 2): "

if "%choice%"=="1" (
    set FLAVOR=playStore
    set BUILD_CMD=bundlePlayStoreRelease
    set OUTPUT_PATH=android\app\build\outputs\bundle\playStoreRelease\app-playStore-release.aab
    set OUTPUT_NAME=AAB
) else if "%choice%"=="2" (
    set FLAVOR=standalone
    set BUILD_CMD=assembleStandaloneRelease
    set OUTPUT_PATH=android\app\build\outputs\apk\standalone\release\app-standalone-release.apk
    set OUTPUT_NAME=APK
) else (
    echo 无效选项，退出
    pause
    exit /b 1
)

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
echo ========================================
echo   打包完成!
echo ========================================
echo.
echo %OUTPUT_NAME% 文件位置:
echo %OUTPUT_PATH%
echo.
pause