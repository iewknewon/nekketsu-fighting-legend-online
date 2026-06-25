# 热血格斗传说 - 浏览器联机部署指南

这份项目的目标很明确：

- 你部署一次
- 你和朋友直接打开网页
- 玩家端不安装额外客户端

## 服务入口

- 页面入口：`online.html`
- Node 服务：`online-server/server.js`
- 默认端口：`3001`
- 健康检查：`/health`

## 本地先试通

```bash
npm install
npm run online
```

打开：

```text
http://localhost:3001/
```

Windows 本地也可以直接双击：

```text
deploy-windows.bat
```

## 线上部署最小结构

- Node.js 运行 `online-server/server.js`
- Nginx 或 Caddy 反代到 `3001`
- 域名启用 `HTTPS`
- 至少配置 `STUN`
- 建议同时配置 `TURN`

这版联机依赖 WebRTC，公网环境里 `TURN` 往往会直接影响不同网络之间能不能连上。

## 仓库里已经准备好的文件

- 环境变量模板：[.env.production.example](./.env.production.example)
- PM2 配置：[deploy/ecosystem.config.cjs](./deploy/ecosystem.config.cjs)
- Nginx 示例：[deploy/nginx.nekketsu-online.conf](./deploy/nginx.nekketsu-online.conf)
- Linux 详细步骤：[deploy/DEPLOY-LINUX.md](./deploy/DEPLOY-LINUX.md)

## 最少需要改的环境变量

```bash
PORT=3001
NEKKETSU_NES_CORE=fceumm
NETPLAY_PUBLIC_ORIGIN=https://play.example.com
NETPLAY_STUN_URLS=stun:stun.l.google.com:19302
NETPLAY_TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
NETPLAY_TURN_USERNAME=replace-me
NETPLAY_TURN_CREDENTIAL=replace-me
```

## 最少验证项

1. `curl http://127.0.0.1:3001/health`
2. `curl https://你的域名/health`
3. 浏览器能打开首页
4. ROM 能自动加载
5. 房主能创建房间
6. 第二个浏览器能加入房间

## 冒烟检查

```bash
npm run online:smoke
npm run online:room-smoke
npm run online:advanced-smoke
npm run online:password-smoke
```

## 继续部署

直接按这份完整说明往下做：

- [deploy/DEPLOY-LINUX.md](./deploy/DEPLOY-LINUX.md)
