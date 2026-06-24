import Phaser from 'phaser';

export class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Help' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a3a, 0x1a1a3a, 0x0a0a2a, 0x0a0a2a, 1);
    bg.fillRect(0, 0, width, height);

    // 标题
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.6);
    titleBox.fillRoundedRect(width / 2 - 100, 10, 200, 30, 5);
    titleBox.lineStyle(2, 0xffff00, 1);
    titleBox.strokeRoundedRect(width / 2 - 100, 10, 200, 30, 5);

    this.add.text(width / 2, 25, '游戏说明', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 操作说明
    let y = 50;
    const lineHeight = 15;

    // 玩家1控制
    this.addSection(width / 2, y, '玩家1 控制', '#ff6b6b');
    y += lineHeight + 5;
    this.addControl(20, y, 'WASD', '移动');
    y += lineHeight;
    this.addControl(20, y, 'J', '拳击');
    y += lineHeight;
    this.addControl(20, y, 'K', '踢腿');
    y += lineHeight;
    this.addControl(20, y, 'J + K', '跳跃');
    y += lineHeight + 10;

    // 玩家2控制
    this.addSection(width / 2, y, '玩家2 控制', '#4ecdc4');
    y += lineHeight + 5;
    this.addControl(20, y, '方向键', '移动');
    y += lineHeight;
    this.addControl(20, y, '1', '拳击');
    y += lineHeight;
    this.addControl(20, y, '2', '踢腿');
    y += lineHeight;
    this.addControl(20, y, '1 + 2', '跳跃');
    y += lineHeight + 10;

    // 游戏技巧
    this.addSection(width / 2, y, '游戏技巧', '#ffe66d');
    y += lineHeight + 5;
    this.addTip(width / 2, y, '• 连续攻击可以形成连击');
    y += lineHeight;
    this.addTip(width / 2, y, '• 连击超过3次造成暴击伤害');
    y += lineHeight;
    this.addTip(width / 2, y, '• 受击后有1秒无敌时间');
    y += lineHeight;
    this.addTip(width / 2, y, '• 跳跃可以躲避攻击');
    y += lineHeight;
    this.addTip(width / 2, y, '• 血量低时AI会撤退');
    y += lineHeight + 10;

    // 返回按钮
    const backBtn = this.add.text(width / 2, height - 20, '按 ESC 返回', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    backBtn.setInteractive();
    backBtn.on('pointerover', () => {
      backBtn.setColor('#ffff00');
    });
    backBtn.on('pointerout', () => {
      backBtn.setColor('#ffffff');
    });
    backBtn.on('pointerdown', () => {
      this.scene.start('Title');
    });

    // ESC返回
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.scene.start('Title');
    });
  }

  private addSection(x: number, y: number, text: string, color: string) {
    const sectionText = this.add.text(x, y, text, {
      fontSize: '12px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    sectionText.setOrigin(0.5);

    // 下划线
    const line = this.add.graphics();
    line.lineStyle(1, parseInt(color.replace('#', '0x')), 0.5);
    line.lineBetween(x - 80, y + 8, x + 80, y + 8);
  }

  private addControl(x: number, y: number, key: string, action: string) {
    // 按键框
    const keyBox = this.add.graphics();
    keyBox.fillStyle(0x333333);
    keyBox.fillRoundedRect(x, y - 6, 50, 12, 2);
    keyBox.lineStyle(1, 0xffffff, 0.5);
    keyBox.strokeRoundedRect(x, y - 6, 50, 12, 2);

    this.add.text(x + 25, y, key, {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(x + 60, y, `: ${action}`, {
      fontSize: '9px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
  }

  private addTip(x: number, y: number, text: string) {
    this.add.text(x, y, text, {
      fontSize: '9px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }
}
