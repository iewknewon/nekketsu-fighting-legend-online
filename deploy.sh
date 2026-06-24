#!/bin/bash

set -e

PORT="${PORT:-3001}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

echo "==========================================="
echo "  热血格斗传说 - 浏览器联机启动"
echo "==========================================="
echo

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] 未找到 Node.js，请先安装: https://nodejs.org/"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "[ERROR] 当前目录缺少 package.json"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "安装项目依赖..."
    npm install
fi

if [ ! -f "nekketsu-fighting-legend-cn.nes" ]; then
    echo "[ERROR] 缺少 ROM 文件: nekketsu-fighting-legend-cn.nes"
    exit 1
fi

echo "启动浏览器联机服务..."
PORT="$PORT" npm run online
