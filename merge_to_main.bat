@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Feature → Main 自动合并脚本
echo ========================================
echo.

REM 保存目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 确保工作区干净
echo [1/5] 检查工作区状态...
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if !CHANGES! GTR 0 (
    echo ❌ 工作区有未提交修改
    git status --short
    pause
    exit /b 1
)
echo ✅ 工作区干净
echo.

REM 拉取最新代码
echo [2/5] 更新远程分支...
git fetch origin
echo.

REM 切换到 main
echo [3/5] 切换到 main...
git checkout main
git pull origin main
echo.

REM 合并 feature 分支
echo [4/5] 合并 feature → main...
git merge feature --no-edit
if errorlevel 1 (
    echo ❌ 合并冲突，请手动解决
    pause
    exit /b 1
)
echo ✅ 合并成功
echo.

REM 推送 main
echo [5/5] 推送 main 到远程...
git push origin main
echo.

echo ========================================
echo ✅ 完成！main 已更新
echo ========================================
pause
