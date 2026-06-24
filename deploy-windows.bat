@echo off
setlocal

REM 热血格斗传说 - Windows 启动脚本

set PORT=%PORT%
if "%PORT%"=="" set PORT=3001

cd /d "%~dp0"

echo ============================================
echo   热血格斗传说 - 浏览器联机启动
echo ============================================
echo.

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] 未找到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] 当前目录缺少 package.json
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 安装项目依赖...
    call npm install
    if %errorLevel% neq 0 (
        echo [ERROR] npm install 失败
        pause
        exit /b 1
    )
)

if not exist "nekketsu-fighting-legend-cn.nes" (
    echo [ERROR] 缺少 ROM 文件: nekketsu-fighting-legend-cn.nes
    pause
    exit /b 1
)

echo 启动浏览器联机服务...
set PORT=%PORT%
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:%PORT%/'"
call npm run online
