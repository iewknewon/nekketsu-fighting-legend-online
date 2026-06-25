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
call npm run online:start-local
if %errorLevel% neq 0 (
    echo [ERROR] 本地服务启动失败
    pause
    exit /b 1
)

start "" "http://localhost:%PORT%/"
echo.
echo 服务已启动: http://localhost:%PORT%/
echo 停止服务可执行: npm run online:stop-local
