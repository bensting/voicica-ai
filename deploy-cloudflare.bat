@echo off
setlocal

REM ============================================
REM Cloudflare Workers 部署脚本 (via OpenNext)
REM
REM 用法:
REM   deploy-cloudflare.bat              -- 完整构建 + 部署
REM   deploy-cloudflare.bat --deploy-only    -- 跳过构建，只部署（需已有 .open-next 目录）
REM
REM 前置条件:
REM   1. npm install (已安装 @opennextjs/cloudflare 和 wrangler)
REM   2. npx wrangler login
REM   3. .env.production 已配置好
REM   4. wrangler.jsonc 和 open-next.config.ts 已配置
REM ============================================

set DEPLOY_ONLY=0

if "%~1"=="--deploy-only" set DEPLOY_ONLY=1

echo.
echo ========================================
echo  Cloudflare Workers Deploy (OpenNext)
if "%DEPLOY_ONLY%"=="1" echo  Mode:    deploy-only (skip build)
echo ========================================
echo.

if "%DEPLOY_ONLY%"=="1" (
    if not exist .open-next (
        echo [ERROR] .open-next directory not found! Run without --deploy-only first.
        exit /b 1
    )
    goto :deploy
)

REM --- Step 1: 安装依赖 ---
echo [1/2] Installing dependencies...
call npm install --prefer-offline
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    exit /b 1
)

REM --- Step 2: OpenNext 构建（内含 next build + worker 打包）---
echo [2/2] Building Cloudflare Worker (OpenNext)...
call npx opennextjs-cloudflare build
if %errorlevel% neq 0 (
    echo [ERROR] OpenNext build failed!
    exit /b 1
)

:deploy
REM --- 确保 Cloudflare Queues 存在（已存在则跳过）---
echo.
echo [Queue] Ensuring Cloudflare Queues exist...
call npx wrangler queues create tts-tasks 2>nul
call npx wrangler queues create tts-tasks-dlq 2>nul

REM --- 部署主应用到 Cloudflare Workers ---
echo.
echo [Deploy] Deploying main app to Cloudflare...
call npx opennextjs-cloudflare deploy
if %errorlevel% neq 0 (
    echo [ERROR] Main app deployment failed!
    exit /b 1
)

REM --- 部署 TTS Consumer Worker ---
echo.
echo [Deploy] Deploying TTS Consumer Worker...
pushd workers\tts-consumer
call npm install --prefer-offline
if %errorlevel% neq 0 (
    echo [ERROR] TTS Consumer npm install failed!
    popd
    exit /b 1
)
call npx wrangler deploy
if %errorlevel% neq 0 (
    echo [ERROR] TTS Consumer deployment failed!
    popd
    exit /b 1
)
popd

echo.
echo ========================================
echo  Deploy successful! (main app + tts-consumer)
echo ========================================
echo.

endlocal
