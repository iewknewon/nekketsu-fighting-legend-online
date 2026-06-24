# 热血格斗传说网页联机版

## 这次的目标

这份项目现在走的是你要的路线：

- 你部署一次
- 玩家不用安装任何客户端
- 朋友直接打开网页链接就能进

也就是说：

- 玩家端：只需要浏览器
- 部署端：你需要把网页和联机服务跑起来

## 当前实现

项目已经切到浏览器直玩结构：

- `online.html`
  直接加载本地自托管的 EmulatorJS 页面
- `online-server/server.js`
  提供房间列表、Socket.IO 信令、WebRTC 转发、静态资源服务
- `vendor/emulatorjs`
  固定到仓库里的 EmulatorJS 前端运行时
- `node_modules/@emulatorjs/core-fceumm`
  NES 核心

## 快速启动

在项目根目录执行：

```bash
npm run online
```

Windows 本地试用也可以直接双击：

```text
deploy-windows.bat
```

启动后访问：

```text
http://localhost:3001/
```

## 现在谁需要装东西

### 玩家

不需要装：

- 不需要 `RetroArch`
- 不需要独立模拟器
- 不需要 `Node.js`

只需要：

- 现代浏览器
- 你的页面链接

### 你这边部署端

需要准备：

- `Node.js`
- 项目依赖
- 这份 ROM
- 公网部署时建议配置 `HTTPS`
- 公网部署时建议配置 `STUN/TURN`

## 联机原理

这版不是“每个人都本地装模拟器然后互联”。

它更接近：

- 房主浏览器运行游戏
- 其他玩家通过 WebRTC 接收画面/音频
- 其他玩家的输入通过浏览器回传

这正是“部署后直接打开网页就玩”的关键。

## 房间怎么用

1. 所有人打开同一个页面
2. 房主可以直接点页面上的“打开联机面板”
3. 房主创建房间
4. 其他人刷新房间列表并加入
5. 进入同一个房间后开始联机

## 本地开发和部署提示

### 本地测试

直接运行：

```bash
npm run online
```

然后在同一台机器的多个浏览器窗口里测试页面加载和房间列表。

也可以先跑资源冒烟检查：

```bash
npm run online:smoke
```

再跑协议级联机检查：

```bash
npm run online:room-smoke
npm run online:advanced-smoke
npm run online:password-smoke
```

### 局域网测试

把本机 IP 发给朋友：

```text
http://你的局域网IP:3001/
```

### 公网部署

建议至少做这几件事：

1. 用 Nginx 或 Caddy 反代到 `3001`
2. 开 HTTPS
3. 配 STUN
4. 如果跨网络环境复杂，再配 TURN

## 环境变量

服务端支持这些环境变量：

- `PORT`
  默认 `3001`
- `NEKKETSU_GAME_ID`
  默认 `741992`
- `NETPLAY_PUBLIC_ORIGIN`
  对外公开访问地址，例如 `https://your-domain.com`
- `NETPLAY_STUN_URLS`
  逗号分隔，默认 `stun:stun.l.google.com:19302`
- `NETPLAY_TURN_URLS`
  逗号分隔
- `NETPLAY_TURN_USERNAME`
- `NETPLAY_TURN_CREDENTIAL`

### 示例

```bash
PORT=3001 \
NETPLAY_PUBLIC_ORIGIN=https://play.example.com \
NETPLAY_STUN_URLS=stun:stun.l.google.com:19302 \
npm run online
```

## 当前已知边界

### 1. 这条路比旧版原型更接近你的目标

旧版 `online.html + jsnes/ws` 并不适合这份 `mapper 74` 的 ROM。

现在这版已经换成了成熟浏览器模拟器底座。

### 2. 外网联机不一定只靠 STUN 就够

如果你和朋友处在复杂 NAT 或移动网络环境里，可能需要 TURN 才会稳定。

### 3. 4 人联机是否一次就稳定，需要真实网络再验证

项目已经按 4 人房间设计，但最终稳定性还是要看：

- 浏览器兼容性
- FCEUmm 在网页里的表现
- 你的实际网络环境

## 现在该怎么试

最短路径：

1. 运行 `npm run online`
2. 打开 `http://localhost:3001/`
3. 确认页面能加载 ROM
4. 看页面右下角是否显示“运行状态: 模拟器已就绪”或“游戏已启动”
5. 点“打开联机面板”并测试创建房间和加入房间

## 结论

现在这份项目的方向已经不是“每个人装客户端再联机”，而是：

`你部署一次，玩家直接打开网页就能玩`
