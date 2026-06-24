const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function headerCell(text, width) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })] })],
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: '2B579A' },
    borders: cellBorders,
  });
}
function cell(text, width) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20 })] })],
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: cellBorders,
  });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, size: 32, bold: true, color: '2B579A', font: 'Microsoft YaHei' })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text, size: 24, bold: true, font: 'Microsoft YaHei' })] });
}
function body(text) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 20, font: 'Microsoft YaHei' })] });
}
function mono(text) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 16, font: 'Consolas' })] });
}

// ===== section 2: TOC =====
const tocItems = [
  '一、整体架构', '二、技术栈详细说明', '三、帧同步核心设计',
  '四、服务端详细设计', '五、客户端详细设计', '六、四人同屏渲染',
  '七、确定性改造', '八、部署指南', '九、实施步骤总览',
  '十、关键风险与解决', '附录A: 消息类型定义', '附录B: 关键数据结构'
];

// ===== section 3: main content =====
const mainChildren = [];

// 一
mainChildren.push(h1('一、整体架构'));
mainChildren.push(body('核心原则：服务端只做输入转发，不做游戏逻辑。游戏逻辑在客户端运行，利用帧同步保证4个客户端状态完全一致。'));
mainChildren.push(mono(
`┌──────────────────────────────────────┐
│              你的服务器               │
│  ┌────────┐  ┌──────────────────┐   │
│  │ Nginx  │─▶│ /opt/nekketsu/    │   │
│  │ :80    │  │ public/ (静态文件) │   │
│  │        │  └──────────────────┘   │
│  │ /ws ───┼─▶ Node.js :3001       │
│  │        │  (WebSocket+房间管理)   │
│  └────────┘                        │
└──────────┬───────────────────────────┘
     WebSocket
  ┌────┴────┬────┴────┬────┴────┬────┴────┐
 玩家1     玩家2     玩家3     玩家4   观战者
 浏览器    浏览器    浏览器    浏览器`));

// 二
mainChildren.push(h1('二、技术栈详细说明'));
mainChildren.push(h2('2.1 服务端'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('组件',20),headerCell('选型',20),headerCell('版本',20),headerCell('用途',40)] }),
  new TableRow({ children: [cell('运行时',20),cell('Node.js',20),cell('20 LTS',20),cell('运行 WebSocket 服务',40)] }),
  new TableRow({ children: [cell('WebSocket',20),cell('ws',20),cell('8.x',20),cell('轻量级 WebSocket 库',40)] }),
  new TableRow({ children: [cell('进程守护',20),cell('PM2',20),cell('5.x',20),cell('保持服务常驻，自动重启',40)] }),
  new TableRow({ children: [cell('反向代理',20),cell('Nginx',20),cell('1.24+',20),cell('静态文件+WebSocket代理+HTTPS',40)] }),
  new TableRow({ children: [cell('缓存(可选)',20),cell('Redis',20),cell('7.x',20),cell('房间持久化、战绩记录',40)] }),
] }));
mainChildren.push(h2('2.2 客户端'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('组件',20),headerCell('选型',20),headerCell('版本',20),headerCell('用途',40)] }),
  new TableRow({ children: [cell('游戏引擎',20),cell('Phaser 3',20),cell('3.85+',20),cell('渲染、物理、音效',40)] }),
  new TableRow({ children: [cell('语言',20),cell('TypeScript',20),cell('5.5',20),cell('类型安全',40)] }),
  new TableRow({ children: [cell('构建',20),cell('Vite',20),cell('5.3',20),cell('打包构建',40)] }),
  new TableRow({ children: [cell('手柄',20),cell('Gamepad API',20),cell('浏览器原生',20),cell('读取手柄输入',40)] }),
] }));

// 三
mainChildren.push(h1('三、帧同步核心设计'));
mainChildren.push(h2('3.1 为什么用帧同步而不是状态同步'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('对比维度',20),headerCell('帧同步(Lockstep)',40),headerCell('状态同步',40)] }),
  new TableRow({ children: [cell('延迟要求',20),cell('严格(需等最慢的人)',40),cell('宽松(服务端权威)',40)] }),
  new TableRow({ children: [cell('带宽',20),cell('极低(只传按键,几十字节/帧)',40),cell('高(传位置/血量/状态)',40)] }),
  new TableRow({ children: [cell('一致性',20),cell('天然一致',40),cell('需大量补偿逻辑',40)] }),
  new TableRow({ children: [cell('适用场景',20),cell('RTS、格斗、回合制',40),cell('FPS、MMO',40)] }),
  new TableRow({ children: [cell('格斗契合度',20),cell('★★★★★',40),cell('★★',40)] }),
] }));
mainChildren.push(h2('3.2 帧同步流程'));
mainChildren.push(body('Step 1 - 客户端采集输入 (~16ms/帧): 键盘状态(WASD,JK)+手柄状态(摇杆+按键)→打包成2字节'));
mainChildren.push(body('Step 2 - 发送给服务端: WebSocket 二进制帧，附带帧号(frameNumber)'));
mainChildren.push(body('Step 3 - 服务端收集并广播: 设定超时窗口(默认50ms)，收集齐4人输入或超时→打包广播。超时未发→填充空操作'));
mainChildren.push(body('Step 4 - 客户端执行: 放入输入队列，按帧号顺序执行。游戏是确定性的，4人结果完全一致'));
mainChildren.push(h2('3.3 输入编码格式'));
mainChildren.push(body('每个玩家每帧2字节 = 方向4bit+拳1bit+踢1bit+跳1bit+防御1bit+保留'));
mainChildren.push(body('服务端广播包 = 帧号(4字节)+4×玩家输入(各2字节) = 12字节/帧'));
mainChildren.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '带宽: 12 bytes × 60fps = 720 bytes/s ≈ 5.76 Kbps (极低)', size: 20, bold: true, color: '009900', font: 'Microsoft YaHei' })] }));
mainChildren.push(h2('3.4 延迟处理策略'));
mainChildren.push(body('• 输入缓冲区: 保持4帧缓冲 (INPUT_BUFFER_SIZE = 4)'));
mainChildren.push(body('• 最大延迟容忍: 100ms (MAX_INPUT_DELAY = 100)'));
mainChildren.push(body('• 超时降级: 自动填充空输入，防止卡住所有人'));
mainChildren.push(body('• 预测执行: 本地输入立即执行，远程输入延迟补偿'));

// 四
mainChildren.push(h1('四、服务端详细设计'));
mainChildren.push(h2('4.1 项目结构'));
mainChildren.push(mono(
`server/
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts          # 入口，启动 WS 服务
│   ├── RoomManager.ts   # 房间管理
│   ├── Room.ts          # 单个房间逻辑
│   ├── Player.ts        # 玩家连接信息
│   ├── InputForwarder.ts # 输入收集+转发
│   └── types.ts         # 类型定义`));
mainChildren.push(h2('4.2 核心模块'));
mainChildren.push(new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: 'RoomManager - 房间管理', size: 21, bold: true })] }));
mainChildren.push(body('• createRoom(host,options) - 创建房间，返回4位数字房间号'));
mainChildren.push(body('• joinRoom(roomId,ws,playerName) - 加入房间，最多4人'));
mainChildren.push(body('• leaveRoom(roomId,ws) - 离开房间，房间空则清理'));
mainChildren.push(body('• getRoomList() - 获取可加入的房间列表'));
mainChildren.push(body('• scheduleCleanup(roomId) - 5分钟无人自动清理'));
mainChildren.push(new Paragraph({ spacing: { before: 100, after: 50 }, children: [new TextRun({ text: 'InputForwarder - 帧同步核心', size: 21, bold: true })] }));
mainChildren.push(body('• receiveInput(playerSlot,input,frameNum) - 接收单玩家输入'));
mainChildren.push(body('• startFrameLoop(playerCount,callback) - 启动16ms帧循环'));
mainChildren.push(body('• 超时未收到 → 自动填充空输入[0,0]'));
mainChildren.push(body('• stopFrameLoop() - 停止帧循环'));

// 五
mainChildren.push(h1('五、客户端详细设计'));
mainChildren.push(h2('5.1 新增文件结构'));
mainChildren.push(mono(
`src/
├── network/
│   ├── NetworkManager.ts   # WebSocket连接管理
│   ├── InputSync.ts        # 帧同步客户端逻辑
│   └── types.ts            # 网络消息类型
├── scenes/
│   ├── LobbyScene.ts       # 大厅(房间列表)
│   ├── RoomScene.ts        # 房间内(等待/选人)
│   └── OnlineFightScene.ts # 在线对战场景
├── input/
│   └── InputCapture.ts     # 统一输入采集(键盘+手柄)`));
mainChildren.push(h2('5.2 核心模块'));
mainChildren.push(new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: 'NetworkManager', size: 21, bold: true })] }));
mainChildren.push(body('• connect() - WebSocket连接+心跳测延迟'));
mainChildren.push(body('• send(type,data) - 发送JSON消息'));
mainChildren.push(body('• on(type,handler) - 注册消息处理器'));
mainChildren.push(body('• 断线自动重连(3秒间隔)'));
mainChildren.push(new Paragraph({ spacing: { before: 100, after: 50 }, children: [new TextRun({ text: 'InputSync', size: 21, bold: true })] }));
mainChildren.push(body('• sendLocalInput(input) - 每帧发送本地输入'));
mainChildren.push(body('• tryExecute() - 从缓冲队列按序执行帧'));
mainChildren.push(body('• 执行延迟2帧(~33ms)保证输入完整性'));
mainChildren.push(new Paragraph({ spacing: { before: 100, after: 50 }, children: [new TextRun({ text: 'InputCapture', size: 21, bold: true })] }));
mainChildren.push(body('• capture() - 采集键盘/手柄输入→2字节Uint8Array'));
mainChildren.push(body('• setupKeyboard(config) - 配置按键映射'));
mainChildren.push(body('• captureGamepad() - 读取Gamepad API'));
mainChildren.push(h2('5.3 四人默认键位配置'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('玩家',12),headerCell('设备',20),headerCell('移动',20),headerCell('拳',12),headerCell('踢',12),headerCell('跳',12),headerCell('防',12)] }),
  new TableRow({ children: [cell('P1',12),cell('键盘1',20),cell('WASD',20),cell('J',12),cell('K',12),cell('空格',12),cell('U',12)] }),
  new TableRow({ children: [cell('P2',12),cell('键盘2',20),cell('↑↓←→',20),cell('1',12),cell('2',12),cell('0',12),cell('9',12)] }),
  new TableRow({ children: [cell('P3',12),cell('手柄1',20),cell('摇杆/十字键',20),cell('B',12),cell('A',12),cell('X',12),cell('RB',12)] }),
  new TableRow({ children: [cell('P4',12),cell('手柄2',20),cell('摇杆/十字键',20),cell('B',12),cell('A',12),cell('X',12),cell('RB',12)] }),
] }));

// 六
mainChildren.push(h1('六、四人同屏渲染'));
mainChildren.push(h2('6.1 动态镜头'));
mainChildren.push(body('• 实时计算4人的包围盒(minX,minY,maxX,maxY)'));
mainChildren.push(body('• 根据包围盒自动缩放(最大1.5倍放大)'));
mainChildren.push(body('• 镜头始终居中于4人中心点'));
mainChildren.push(body('• 边距保护: 左右+80px, 上下+60px'));
mainChildren.push(h2('6.2 四人UI布局'));
mainChildren.push(body('• 顶部: 计时器+连击显示'));
mainChildren.push(body('• 左上/右上: P1/P2血条+角色名'));
mainChildren.push(body('• 左下/右下: P3/P4血条+角色名'));
mainChildren.push(body('• 中央: K.O.提示+击败信息'));

// 七
mainChildren.push(h1('七、确定性改造'));
mainChildren.push(body('• 使用 SeededRandom(线性同余)替代 Math.random()'));
mainChildren.push(body('• 服务端开局时生成seed，广播给所有客户端'));
mainChildren.push(body('• 禁止使用 Date.now() 做逻辑判断'));
mainChildren.push(body('• 所有浮点运算使用固定精度'));
mainChildren.push(body('• 物理更新使用固定时间步长(16ms)'));

// 八
mainChildren.push(h1('八、部署指南'));
mainChildren.push(h2('8.1 服务端部署'));
mainChildren.push(mono(
`# 1. 上传代码到服务器
scp -r ./server user@your-server:/opt/nekketsu/server/
scp -r ./public user@your-server:/opt/nekketsu/public/

# 2. 安装依赖
cd /opt/nekketsu/server && npm install

# 3. 安装PM2并启动
npm install -g pm2
pm2 start src/main.ts --name nekketsu-server
pm2 save
pm2 startup`));
mainChildren.push(h2('8.2 Nginx配置'));
mainChildren.push(mono(
`server {
    listen 80;
    server_name your-domain.com;
    root /opt/nekketsu/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    gzip on;
    gzip_types text/javascript application/javascript text/css;
}`));
mainChildren.push(h2('8.3 前端构建'));
mainChildren.push(mono('cd /opt/nekketsu && npm install && npm run build\n# 输出到 public/ 目录'));

// 九
mainChildren.push(h1('九、实施步骤总览'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('步骤',8),headerCell('内容',42),headerCell('时间',15),headerCell('优先级',12),headerCell('产出',23)] }),
  new TableRow({ children: [cell('1',8),cell('搭建服务端:WebSocket+房间管理',42),cell('2-3h',15),cell('★★★',12),cell('server/src/*.ts',23)] }),
  new TableRow({ children: [cell('2',8),cell('前端大厅+房间:创建/加入房间UI',42),cell('2-3h',15),cell('★★★',12),cell('LobbyScene,RoomScene',23)] }),
  new TableRow({ children: [cell('3',8),cell('帧同步核心:输入采集→发送→广播→执行',42),cell('3-4h',15),cell('★★★',12),cell('InputSync,InputForwarder',23)] }),
  new TableRow({ children: [cell('4',8),cell('在线对战场景:改造FightScene',42),cell('2-3h',15),cell('★★★',12),cell('OnlineFightScene',23)] }),
  new TableRow({ children: [cell('5',8),cell('四人同屏渲染:动态镜头+UI',42),cell('1-2h',15),cell('★★',12),cell('DynamicCamera',23)] }),
  new TableRow({ children: [cell('6',8),cell('手柄支持:Gamepad API',42),cell('1h',15),cell('★★',12),cell('InputCapture',23)] }),
  new TableRow({ children: [cell('7',8),cell('确定性改造:种子随机+固定步长',42),cell('1-2h',15),cell('★★',12),cell('SeededRandom',23)] }),
  new TableRow({ children: [cell('8',8),cell('部署测试:服务器部署+4人联调',42),cell('1-2h',15),cell('★',12),cell('Nginx配置+PM2',23)] }),
  new TableRow({ children: [cell('9',8),cell('优化:观战、回放、重连',42),cell('可选',15),cell('★',12),cell('扩展功能',23)] }),
] }));

// 十
mainChildren.push(h1('十、关键风险与解决'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('风险',20),headerCell('影响',30),headerCell('解决方案',50)] }),
  new TableRow({ children: [cell('帧同步延迟',20),cell('有人网络差拖慢所有人',30),cell('超时降级+空输入填充;延迟显示提示',50)] }),
  new TableRow({ children: [cell('确定性不一致',20),cell('4人画面不同步',30),cell('严格种子随机+禁止Date.now()+固定浮点精度',50)] }),
  new TableRow({ children: [cell('4人输入冲突',20),cell('同一键盘键位冲突',30),cell('P3/P4默认走手柄;键位可自定义',50)] }),
  new TableRow({ children: [cell('断线',20),cell('4人中有人掉线',30),cell('自动填充空输入;房间可继续;重连恢复',50)] }),
  new TableRow({ children: [cell('房主掉线',20),cell('房间解散',30),cell('房主转移机制;或服务端接管',50)] }),
] }));

// 附录A
mainChildren.push(h1('附录A: 消息类型定义'));
mainChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [headerCell('类型',12),headerCell('值',8),headerCell('方向',20),headerCell('说明',60)] }),
  new TableRow({ children: [cell('CREATE_ROOM',12),cell('0',8),cell('客户端→服务端',20),cell('创建房间',60)] }),
  new TableRow({ children: [cell('JOIN_ROOM',12),cell('1',8),cell('客户端→服务端',20),cell('加入房间',60)] }),
  new TableRow({ children: [cell('LEAVE_ROOM',12),cell('2',8),cell('客户端→服务端',20),cell('离开房间',60)] }),
  new TableRow({ children: [cell('ROOM_LIST',12),cell('3',8),cell('双向',20),cell('房间列表请求/响应',60)] }),
  new TableRow({ children: [cell('PLAYER_JOINED',12),cell('10',8),cell('服务端→客户端',20),cell('有新玩家加入',60)] }),
  new TableRow({ children: [cell('PLAYER_LEFT',12),cell('11',8),cell('服务端→客户端',20),cell('有玩家离开',60)] }),
  new TableRow({ children: [cell('SELECT_CHARACTER',12),cell('12',8),cell('双向',20),cell('选择角色',60)] }),
  new TableRow({ children: [cell('TOGGLE_READY',12),cell('13',8),cell('双向',20),cell('准备/取消准备',60)] }),
  new TableRow({ children: [cell('GAME_START',12),cell('14',8),cell('双向',20),cell('开始游戏',60)] }),
  new TableRow({ children: [cell('PLAYER_INPUT',12),cell('20',8),cell('客户端→服务端',20),cell('玩家操作输入',60)] }),
  new TableRow({ children: [cell('FRAME_SYNC',12),cell('21',8),cell('服务端→客户端',20),cell('帧同步广播',60)] }),
  new TableRow({ children: [cell('GAME_OVER',12),cell('30',8),cell('服务端→客户端',20),cell('游戏结束',60)] }),
  new TableRow({ children: [cell('REMATCH',12),cell('31',8),cell('双向',20),cell('再来一局',60)] }),
] }));

// 附录B
mainChildren.push(h1('附录B: 关键数据结构'));
mainChildren.push(new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: 'RoomInfo', size: 20, bold: true, font: 'Consolas' })] }));
mainChildren.push(mono(
`{
  id: string;          // 4位房间号
  name: string;        // 房间名称
  players: PlayerInfo[]; // 玩家列表(0-4人)
  maxPlayers: number;  // 最大玩家数(固定4)
  mode: "ffa"|"2v2"|"1v3"; // 对战模式
  status: "waiting"|"selecting"|"playing"|"finished";
}`));
mainChildren.push(new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: 'PlayerInfo', size: 20, bold: true, font: 'Consolas' })] }));
mainChildren.push(mono(
`{
  id: string;          // 连接ID
  name: string;        // 玩家名称
  slot: number;        // 槽位 0-3
  character?: string;  // 选中角色(kunio,riki,...)
  ready: boolean;      // 是否准备
  team?: number;       // 队伍(0或1,仅2v2模式)
  ping: number;        // 延迟(ms)
}`));

// ===== assemble document =====
const doc = new Document({
  sections: [
    // Title page
    {
      properties: { page: { size: { width: 11906, height: 16838 } } },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '热血格斗传说', size: 56, bold: true, color: 'CC0000', font: 'Microsoft YaHei' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'オンライン四人对戦', size: 36, color: '333333', font: 'Microsoft YaHei' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Nekketsu Kakutou Densetsu - Online Edition', size: 22, color: '666666' })] }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CC0000' }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CC0000' } }, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: '  详细技术实现方案  ', size: 28, bold: true, color: '2B579A', font: 'Microsoft YaHei' })] }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '文档版本: v1.0', size: 20, color: '666666' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '日期: 2026-06-24', size: 20, color: '666666' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '技术栈: Phaser 3 + TypeScript + Node.js + WebSocket', size: 20, color: '666666' })] }),
      ]
    },
    // TOC page
    {
      properties: { page: { size: { width: 11906, height: 16838 } } },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 300 }, children: [new TextRun({ text: '目录', size: 32, bold: true, color: '2B579A', font: 'Microsoft YaHei' })] }),
        ...tocItems.map(t => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, color: '333333', font: 'Microsoft YaHei' })] })),
      ]
    },
    // Main content
    {
      properties: { page: { size: { width: 11906, height: 16838 } } },
      children: mainChildren,
    }
  ]
});

const OUT_PATH = 'e:/AJC/热血物语/热血格斗传说_在线四人对战方案.docx';

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUT_PATH, buffer);
  console.log('Word文档已生成: 热血格斗传说_在线四人对战方案.docx');
  console.log('大小:', (buffer.length / 1024).toFixed(1), 'KB');
}).catch(err => {
  console.error('生成失败:', err.message);
  process.exit(1);
});
