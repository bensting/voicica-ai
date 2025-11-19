@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
REM File: merge_to_main.bat
REM 将 dev 分支合并到 main 分支的脚本


echo ========================================
echo   Dev → Main 分支合并脚本
echo ========================================
echo.

REM 保存当前目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. 检查当前状态
echo [1/7] 检查当前状态...
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 工作区有未提交的修改
    git status --short
    pause
    exit /b 1
)
echo ✅ 工作区干净
echo.

REM 2. 拉取最新代码
echo [2/7] 拉取最新代码...
git fetch origin
if errorlevel 1 (
    echo ❌ 拉取失败
    pause
    exit /b 1
)
echo ✅ 拉取完成
echo.

REM 3. 切换到 dev 并更新
echo [3/7] 切换到 dev 分支...
git checkout dev
if errorlevel 1 (
    echo ❌ 切换分支失败
    pause
    exit /b 1
)

git pull origin dev
if errorlevel 1 (
    echo ❌ 拉取 dev 失败
    pause
    exit /b 1
)
echo ✅ dev 分支已更新
echo.

REM 4. 显示即将合并的提交
echo [4/7] 即将合并的提交列表：
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git --no-pager log origin/main..HEAD --oneline --graph -20
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 5. 确认合并
set /p CONFIRM="⚠️  是否将 dev 合并到 main？(yes/no): "
if /i not "!CONFIRM!"=="yes" (
    echo ❌ 已取消合并
    pause
    exit /b 0
)
echo.

REM 6-9. 执行合并流程（一次性完成，避免切换分支导致脚本中断）
(
    echo [5/7] 切换到 main 分支...
    git checkout main || goto :error

    git pull origin main || goto :error
    echo ✅ main 分支已更新
    echo.

    echo [6/7] 合并 dev 到 main...
    git merge dev --no-ff -m "Merge branch 'dev' into main" || goto :merge_error
    echo ✅ 合并成功
    echo.

    echo [7/7] 推送到远程...
    git push origin main || goto :error
    echo ✅ 推送完成
    echo.

    echo 🔄 切换回 dev 分支...
    git checkout dev
    echo.

    goto :success
)

:merge_error
echo ❌ 合并失败，可能存在冲突
echo 请手动解决冲突后：
echo   git add .
echo   git commit
echo   git push origin main
pause
exit /b 1

:error
echo ❌ 操作失败
pause
exit /b 1

:success
echo ========================================
echo ✅ 合并完成！
echo ========================================
echo.
