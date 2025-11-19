@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Feature to Main - Auto Merge Script
echo ========================================
echo.

REM Save directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check working directory is clean
echo [1/5] Checking workspace...
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if !CHANGES! GTR 0 (
    echo [X] Workspace has uncommitted changes
    git status --short
    pause
    exit /b 1
)
echo [OK] Workspace is clean
echo.

REM Fetch remote
echo [2/5] Fetching remote...
git fetch origin
if errorlevel 1 (
    echo [X] Failed to fetch remote
    pause
    exit /b 1
)
echo [OK] Remote updated
echo.

REM Switch to main
echo [3/5] Switching to main...
git checkout main
if errorlevel 1 (
    echo [X] Failed to checkout main
    pause
    exit /b 1
)
git pull origin main
if errorlevel 1 (
    echo [X] Failed to pull main
    pause
    exit /b 1
)
echo [OK] Main branch updated
echo.

REM Merge feature branch
echo [4/5] Merging feature into main...
git merge feature --no-edit
if errorlevel 1 (
    echo [X] Merge conflict - please resolve manually
    pause
    exit /b 1
)
echo [OK] Merge successful
echo.

REM Push main
echo [5/5] Pushing main to remote...
git push origin main
if errorlevel 1 (
    echo [X] Failed to push
    pause
    exit /b 1
)
echo [OK] Push successful
echo.

echo ========================================
echo [OK] Done! Main branch has been updated
echo ========================================
pause