@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
REM ========================================
REM File: merge_to_main.bat
REM 将 feature 分支通过 PR 合并到 main 分支
REM ========================================
REM
REM 功能说明:
REM   - 检查工作区状态
REM   - 同步 feature 分支
REM   - 检查与 main 的差异
REM   - 推送 feature 并创建 Pull Request
REM
REM 前置要求:
REM   1. 安装 GitHub CLI: winget install GitHub.cli
REM   2. 登录 GitHub: gh auth login
REM   3. main 分支已开启保护（只允许 PR 合并）
REM
REM 使用方法:
REM   双击运行或在命令行执行: .\merge_to_main.bat
REM
REM 注意事项:
REM   - 运行前确保所有修改已提交
REM   - PR 创建后需在 GitHub 上审核并合并
REM   - 如果 gh 未安装，会提供手动创建 PR 的链接
REM
REM ========================================


echo ========================================
echo   Feature → Main 分支 PR 脚本
echo ========================================
echo.

REM 保存当前目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. 检查当前状态
echo [1/6] 检查当前状态...
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set CHANGES=%%i
if !CHANGES! GTR 0 (
    echo ❌ 错误: 工作区有未提交的修改
    git status --short
    pause
    exit /b 1
)
echo ✅ 工作区干净
echo.

REM 2. 拉取最新代码
echo [2/6] 拉取最新代码...
git fetch origin
if errorlevel 1 (
    echo ❌ 拉取失败
    pause
    exit /b 1
)
echo ✅ 拉取完成
echo.

REM 3. 切换到 feature 并更新
echo [3/6] 切换到 feature 分支...
git checkout feature
if errorlevel 1 (
    echo ❌ 切换分支失败
    pause
    exit /b 1
)

git pull origin feature
if errorlevel 1 (
    echo ❌ 拉取 feature 失败
    pause
    exit /b 1
)
echo ✅ feature 分支已更新
echo.

REM 4. 检查 main 有但 feature 没有的提交
echo [4/6] 检查分支差异...
for /f %%i in ('git rev-list --count HEAD..origin/main') do set MAIN_AHEAD=%%i
if !MAIN_AHEAD! GTR 0 (
    echo.
    echo ⚠️  警告: main 分支有 !MAIN_AHEAD! 个提交不在 feature 中：
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    git --no-pager log HEAD..origin/main --oneline --graph
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo 建议先将 main 合并到 feature 以避免冲突
    set /p SYNC_CONFIRM="是否继续创建 PR？(yes/no): "
    if /i not "!SYNC_CONFIRM!"=="yes" (
        echo ❌ 已取消
        pause
        exit /b 0
    )
    echo.
) else (
    echo ✅ feature 包含 main 的所有提交
)
echo.

REM 5. 显示即将合并的提交
echo [5/6] 即将合并的提交列表：
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git --no-pager log origin/main..HEAD --oneline --graph -20
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 检查是否有提交需要合并
for /f %%i in ('git rev-list --count origin/main..HEAD') do set COMMITS_AHEAD=%%i
if !COMMITS_AHEAD! EQU 0 (
    echo ✅ feature 和 main 已同步，无需创建 PR
    pause
    exit /b 0
)

REM 6. 确认并创建 PR
set /p CONFIRM="⚠️  是否将 feature 推送并创建 PR 到 main？(yes/no): "
if /i not "!CONFIRM!"=="yes" (
    echo ❌ 已取消
    pause
    exit /b 0
)
echo.

echo [6/6] 推送并创建 PR...

REM 推送 feature 分支
git push origin feature
if errorlevel 1 (
    echo ❌ 推送失败
    pause
    exit /b 1
)
echo ✅ feature 已推送到远程
echo.

REM 检查是否已有 PR
for /f "delims=" %%i in ('gh pr list --head feature --base main --state open --json number --jq ".[0].number" 2^>nul') do set EXISTING_PR=%%i

if defined EXISTING_PR (
    echo ✅ PR #!EXISTING_PR! 已存在
    echo 🔗 https://github.com/benshui08/ai-voice-labs-web/pull/!EXISTING_PR!
) else (
    REM 创建新 PR
    echo 正在创建 PR...
    gh pr create --base main --head feature --title "Merge feature into main" --body "合并 feature 分支到 main。查看提交历史了解详细变更。"

    if errorlevel 1 (
        echo ❌ 创建 PR 失败
        echo 请手动在 GitHub 上创建 PR:
        echo https://github.com/benshui08/ai-voice-labs-web/compare/main...feature
        pause
        exit /b 1
    )
    echo ✅ PR 创建成功
)

echo.
echo ========================================
echo ✅ 完成！请在 GitHub 上审核并合并 PR
echo ========================================
echo.
pause
