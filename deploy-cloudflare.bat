@echo off
setlocal

REM ============================================
REM Cloudflare Workers 部署脚本 (via OpenNext)
REM
REM 用法:
REM   deploy-cloudflare.bat              -- 完整构建 + 部署
REM   deploy-cloudflare.bat --deploy-only    -- 跳过 Next.js 构建，只运行 OpenNext 打包 + 部署
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
if "%DEPLOY_ONLY%"=="1" echo  Mode:    deploy-only (skip Next.js build)
echo ========================================
echo.

if "%DEPLOY_ONLY%"=="1" (
    if not exist .next (
        echo [ERROR] .next directory not found! Run without --deploy-only first.
        exit /b 1
    )
    goto :opennext
)

REM --- Step 1: 安装依赖 ---
echo [1/3] Installing dependencies...
call npm install --prefer-offline
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    exit /b 1
)

REM --- Step 2: Prisma generate ---
echo [2/3] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed!
    exit /b 1
)

REM --- Step 3: Next.js build ---
echo [3/3] Building Next.js...
call npx next build
if %errorlevel% neq 0 (
    echo [ERROR] Next.js build failed!
    exit /b 1
)

:opennext
REM --- OpenNext: 打包为 Cloudflare Worker ---
echo.
echo [OpenNext] Building Cloudflare Worker...
call npx opennextjs-cloudflare build
if %errorlevel% neq 0 (
    echo [ERROR] OpenNext build failed!
    exit /b 1
)

REM --- 部署到 Cloudflare Workers ---
echo.
echo [Deploy] Deploying to Cloudflare...
call npx opennextjs-cloudflare deploy
if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed!
    exit /b 1
)

echo.
echo ========================================
echo  Deploy successful!
echo ========================================
echo.

endlocal
