# 热血格斗传说 - 浏览器联机部署指南

## 现在的部署目标

当前项目的目标已经调整为：

- 你部署一次
- 玩家直接打开网页链接
- 玩家不需要安装模拟器客户端

入口页面是：

- `online.html`

服务端是：

- `online-server/server.js`

## 目录结构

```text
热血物语/
├── nekketsu-fighting-legend-cn.nes
├── online.html
├── online-server/
│   └── server.js
├── node_modules/
├── package.json
└── README-NETPLAY.md
```

## 本地启动

```bash
npm run online
```

Windows 上如果只是要快速试页面，也可以直接双击：

```text
deploy-windows.bat
```

然后打开：

```text
http://localhost:3001/
```

## 对外部署建议

### 推荐结构

- Node.js 服务跑在 `3001`
- Nginx / Caddy 做反代
- 对外暴露 `HTTPS`

### 为什么建议 HTTPS

这套联机模式使用 WebRTC。

虽然本地开发可以在 `localhost` 下工作，但公网部署时：

- HTTPS 更稳
- 浏览器兼容性更好
- WebRTC 权限和策略更少踩坑

## 公网部署最小建议

1. 服务器安装 Node.js
2. 把项目放到服务器
3. 执行 `npm install`
4. 执行 `npm run online`
5. 用 Nginx 反代到 `3001`
6. 配置 HTTPS

## 反代示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 环境变量

### 常用

- `PORT`
- `NETPLAY_PUBLIC_ORIGIN`
- `NETPLAY_STUN_URLS`
- `NETPLAY_TURN_URLS`
- `NETPLAY_TURN_USERNAME`
- `NETPLAY_TURN_CREDENTIAL`

### 示例

```bash
PORT=3001
NETPLAY_PUBLIC_ORIGIN=https://play.example.com
NETPLAY_STUN_URLS=stun:stun.l.google.com:19302
```

## STUN / TURN

### 局域网或简单公网

很多时候 STUN 就够了。

### 复杂网络环境

如果朋友们：

- 在不同运营商
- 用移动网络
- 在严格 NAT 后面

那就建议配 TURN，否则可能有人能看到页面但进不了房间或收不到流。

## 验证清单

部署后至少验证这些：

1. `/health` 返回正常
2. 根路径 `/` 能直接打开联机页
3. 游戏能自动加载 ROM
4. `Netplay` 菜单能打开
5. 房主能创建房间
6. 第二个浏览器能看到房间并加入

## 本地冒烟检查

项目提供了一个本地检查脚本，用来确认联机页依赖资源都能正常返回：

```bash
npm run online:smoke
```

如果要继续确认联机服务协议本身正常，可以再执行：

```bash
npm run online:room-smoke
npm run online:advanced-smoke
npm run online:password-smoke
```

## 当前重点

如果你现在的目标是尽快做成“别人点链接就玩”，优先看：

- [README-NETPLAY.md](./README-NETPLAY.md)
