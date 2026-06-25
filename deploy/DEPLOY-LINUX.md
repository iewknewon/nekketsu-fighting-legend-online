# Linux 服务器部署

这份说明对应目标：

- 你把项目部署到自己的服务器
- 你和朋友只打开网页
- 不安装客户端

## 1. 服务器准备

- Ubuntu 22.04 / Debian 12 均可
- 域名，示例：`play.example.com`
- 建议开启 `HTTPS`
- 建议准备 `TURN` 服务

## 2. 安装运行环境

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 3. 拉取项目

```bash
git clone https://github.com/iewknewon/nekketsu-fighting-legend-online.git
cd nekketsu-fighting-legend-online
```

## 4. 安装依赖

```bash
npm install
```

## 5. 配置环境变量

```bash
cp .env.production.example .env.production
```

然后编辑 `.env.production`，至少改这些：

- `NETPLAY_PUBLIC_ORIGIN`
- `NETPLAY_STUN_URLS`
- `NETPLAY_TURN_URLS`
- `NETPLAY_TURN_USERNAME`
- `NETPLAY_TURN_CREDENTIAL`

## 6. 确认 ROM 在仓库内

当前服务默认读取：

```text
nekketsu-fighting-legend-cn.nes
```

如果你后续不想把 ROM 放仓库里，需要单独调整 `online-server/server.js` 的 `romUrl` 和部署目录。

## 7. 启动服务

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 8. 配置 Nginx

```bash
sudo cp deploy/nginx.nekketsu-online.conf /etc/nginx/sites-available/nekketsu-online.conf
sudo ln -s /etc/nginx/sites-available/nekketsu-online.conf /etc/nginx/sites-enabled/nekketsu-online.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 9. 配 HTTPS

如果你用 `certbot`：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d play.example.com
```

## 10. 验证

至少检查：

```bash
curl http://127.0.0.1:3001/health
curl https://play.example.com/health
```

然后浏览器打开：

```text
https://play.example.com/
```

## 11. 常用维护命令

```bash
pm2 status
pm2 logs nekketsu-online
pm2 restart nekketsu-online
pm2 stop nekketsu-online
```

## 12. 外网联机失败时先查什么

先看这几项：

- 域名是否正确指向服务器
- `NETPLAY_PUBLIC_ORIGIN` 是否与实际访问地址一致
- 页面是否走 `HTTPS`
- 浏览器控制台是否报 WebRTC / ICE 错误
- `TURN` 是否真的可用

如果没有 `TURN`，很多朋友在不同网络下会出现：

- 看得到房间
- 但加入后没画面 / 没声音 / 一直连不上
