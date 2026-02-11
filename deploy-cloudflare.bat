@echo off
setlocal enabledelayedexpansion

REM ============================================
REM Cloudflare Pages 部署脚本
REM 用法:
REM   deploy-cloudflare.bat              -- 部署到 production
REM   deploy-cloudflare.bat preview      -- 部署到 preview
REM ============================================

set PROJECT_NAME=voicica
set BRANCH=%1
if "%BRANCH%"=="" set BRANCH=production

echo.
echo ========================================
echo  Cloudflare Pages Deploy
echo  Project: %PROJECT_NAME%
echo  Target:  %BRANCH%
echo ========================================
echo.

REM --- Step 0: 检查依赖 ---
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npx not found. Please install Node.js first.
    exit /b 1
)

REM 检查 wrangler 是否可用
call npx wrangler --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing wrangler...
    call npm install -g wrangler
)

REM --- Step 1: 加载环境变量 ---
echo [1/5] Loading .env.cloudflare...
if not exist .env.cloudflare (
    echo [ERROR] .env.cloudflare not found!
    echo        Copy .env.production to .env.cloudflare and update values.
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in (".env.cloudflare") do (
    set "line=%%a"
    REM 跳过注释和空行
    if not "!line:~0,1!"=="#" (
        if not "!line!"=="" (
            set "%%a=%%b"
        )
    )
)
echo     Done.

REM --- Step 2: 安装依赖 ---
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    exit /b 1
)

REM --- Step 3: Prisma generate ---
echo [3/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed!
    exit /b 1
)

REM --- Step 4: Next.js build ---
echo [4/5] Building Next.js app...
call npx next build
if %errorlevel% neq 0 (
    echo [ERROR] Next.js build failed!
    exit /b 1
)

REM --- Step 5: 部署到 Cloudflare Pages ---
echo [5/5] Deploying to Cloudflare Pages...
if "%BRANCH%"=="production" (
    call npx wrangler pages deploy .next --project-name=%PROJECT_NAME% --branch=main
) else (
    call npx wrangler pages deploy .next --project-name=%PROJECT_NAME% --branch=%BRANCH%
)

if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed!
    exit /b 1
)

echo.
echo ========================================
echo  Deploy complete!
echo ========================================
echo.

endlocal
