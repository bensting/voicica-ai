@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Feature → Main 自动合并脚本
echo ========================================
echo.

REM 保存当前目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. 检查工作区
echo [1/7] 检查工作区状态...
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if !CHANGES! GTR 0 (
    echo ❌ 工作区有未提交修改:
    git status --short
    pause
    exit /b 1
)
echo ✅ 工作区干净
echo.

REM 2. 更新远程
echo [2/7] 获取最新远程分支...
git fetch origin
if errorlevel 1 (
    echo ❌ 拉取远程分支失败
    pause
    exit /b 1
)
echo ✅ 远程已更新
echo.

REM 3. 切换到 feature 分支并更新
echo [3/7] 切换到 feature 分支...
git checkout feature
if errorlevel 1 (
    echo ❌ feature 分支不存在
    pause
    exit /b 1
)

echo 拉取 feature 最新代码...
git pull origin feature
if errorlevel 1 (
    echo ❌ 拉取 feature 失败
    pause
    exit /b 1
)
echo ✅ feature 已更新
echo.

REM 4. 显示差异
echo [4/7] Feature → Main 差异：
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git --no-pager log origin/main..HEAD --oneline --graph -20
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

for /f %%i in ('git rev-list --count origin/main..HEAD') do set DIFFCNT=%%i
if !DIFFCNT! EQU 0 (
    echo ✅ main 已是最新，无需合并
    pause
    exit /b 0
)

REM 5. 确认合并
set /p CONFIRM="⚠️ 确定要将 feature 合并到 main？(yes/no): "
if /i not "!CONFIRM!"=="yes" (
    echo ❌ 已取消
    pause
    exit /b 0
)
echo.

REM 6. 切 main → 更新 → 合并
echo [5/7] 切换到 main...
git checkout main || goto :error

echo 拉取 main 最新代码...
git pull origin main || goto :error
echo.

echo [6/7] 合并 feature → main...
git merge feature --no-edit
if errorlevel 1 (
    echo ❌ 合并冲突！请手动解决：
    echo   git add .
    echo   git commit
    echo   git push origin main
    pause
    exit /b 1
)
echo ✅ 合并成功
echo.

REM 7. 推送 main
echo [7/7] 推送 main 到远程...
git push origin main || goto :error
echo.

echo 🔄 切回 feature 分支...
git checkout feature
echo.

echo ========================================
echo 🎉 完成！main 已更新并触发部署
echo ========================================
pause
goto :eof

:error
echo ❌ 操作失败
pause
exit /b 1
