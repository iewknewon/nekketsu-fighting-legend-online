# 热血格斗传说 - 浏览器联机版

这份仓库现在只保留一条主线：

- 你把它部署到自己的服务器
- 你和朋友直接打开网页
- 玩家不需要额外安装模拟器客户端

## 快速启动

```bash
npm install
npm run online
```

打开：

```text
http://localhost:3001/
```

Windows 本地快速试用也可以直接双击：

```text
deploy-windows.bat
```

如果你想后台启动/停止本地服务：

```bash
npm run online:start-local
npm run online:stop-local
```

## 当前仓库结构

- `online.html`
  浏览器联机页面，直接加载 EmulatorJS 和 ROM
- `online-server/server.js`
  房间列表、Socket.IO 信令、WebRTC 中转、静态资源服务
- `vendor/emulatorjs`
  自托管的 EmulatorJS 前端运行时
- `nekketsu-fighting-legend-cn.nes`
  默认加载的 ROM
- `deploy/`
  Linux / PM2 / Nginx 部署示例
- `tools/`
  本地启动与联机冒烟检查脚本

## 联机怎么用

1. 房主打开页面并等待模拟器加载完成
2. 填写昵称
3. 创建房间并把页面链接发给朋友
4. 朋友打开同一页面后加入房间

当前页面已经按 4 人房间设计，浏览器端默认提供快速房间列表和加入入口。

## 部署到自己的服务器

优先看这两份说明：

- [README-DEPLOY.md](./README-DEPLOY.md)
- [deploy/DEPLOY-LINUX.md](./deploy/DEPLOY-LINUX.md)

公网部署建议至少具备：

- `HTTPS`
- `STUN`
- `TURN`

没有 `TURN` 时，跨运营商、移动网络或复杂 NAT 环境下很容易出现看得到房间但互联失败的情况。

## 验证命令

```bash
npm run online:smoke
npm run online:room-smoke
npm run online:advanced-smoke
npm run online:password-smoke
```

## 注意

仓库当前仍包含 `nekketsu-fighting-legend-cn.nes`。如果你后续准备把仓库公开，建议单独处理 ROM 分发与版权问题。
