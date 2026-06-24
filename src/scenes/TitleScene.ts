import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  private startKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'Title' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景渐变
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a4d8f, 0x1a4d8f, 0x0d2847, 0x0d2847, 1);
    bg.fillRect(0, 0, width, height);

    // 装饰性星星
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2,
        0xffffff,
        Math.random() * 0.5
      );

      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }

    // 标题背景框
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.5);
    titleBox.fillRoundedRect(width / 2 - 110, 35, 220, 70, 8);
    titleBox.lineStyle(3, 0xffff00, 1);
    titleBox.strokeRoundedRect(width / 2 - 110, 35, 220, 70, 8);

    // 游戏标题（中文）
    const title = this.add.text(width / 2, 60, '热血格斗传说', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#ff0000',
      strokeThickness: 3
    });
    title.setOrigin(0.5);

    // 标题闪烁效果
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // 英文副标题
    const subtitle = this.add.text(width / 2, 90, 'NEKKETSU KAKUTOU DENSETSU', {
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    subtitle.setOrigin(0.5);

    // 版权信息框
    const copyrightBox = this.add.rectangle(width / 2, height - 30, 180, 30, 0x000000, 0.3);
    copyrightBox.setStrokeStyle(1, 0xffffff, 0.5);

    const copyright = this.add.text(width / 2, height - 30, '© 1992 TECHNOS JAPAN\n复刻版 2026', {
      fontSize: '7px',
      color: '#aaaaaa',
      align: 'center'
    });
    copyright.setOrigin(0.5);

    // 游戏模式选择框
    const modeBoxY = height / 2 + 10;
    const modeBox = this.add.graphics();
    modeBox.fillStyle(0x000000, 0.6);
    modeBox.fillRoundedRect(width / 2 - 80, modeBoxY - 40, 160, 100, 5);
    modeBox.lineStyle(2, 0xffffff, 0.8);
    modeBox.strokeRoundedRect(width / 2 - 80, modeBoxY - 40, 160, 100, 5);

    // 模式标题
    this.add.text(width / 2, modeBoxY - 20, '选择模式', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 模式选项
    const modes = [
      { key: '1', label: '1. 单人模式', mode: 'single' },
      { key: '2', label: '2. 双人对战', mode: 'vs_2p' },
      { key: '3', label: '3. 四人混战', mode: 'vs_4p' }
    ];

    modes.forEach((modeData, index) => {
      const y = modeBoxY + index * 20;

      const modeText = this.add.text(width / 2, y, modeData.label, {
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      });
      modeText.setOrigin(0.5);
      modeText.setInteractive();

      // 悬停效果
      modeText.on('pointerover', () => {
        modeText.setColor('#ffff00');
        modeText.setScale(1.1);
      });

      modeText.on('pointerout', () => {
        modeText.setColor('#ffffff');
        modeText.setScale(1);
      });

      modeText.on('pointerdown', () => {
        this.startGame(modeData.mode);
      });

      // 键盘快捷键
      const key = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + index);
      key?.on('down', () => this.startGame(modeData.mode));
    });

    // 开始提示文字（闪烁效果）
    const startText = this.add.text(width / 2, height - 60, 'PRESS ENTER TO START', {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    startText.setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 帮助按钮
    const helpBtn = this.add.text(width - 10, height - 10, '? 帮助', {
      fontSize: '10px',
      color: '#888888',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    }).setOrigin(1, 1);
    helpBtn.setInteractive();
    helpBtn.on('pointerover', () => {
      helpBtn.setColor('#ffff00');
    });
    helpBtn.on('pointerout', () => {
      helpBtn.setColor('#888888');
    });
    helpBtn.on('pointerdown', () => {
      this.scene.start('Help');
    });

    // H键打开帮助
    const hKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    hKey?.on('down', () => {
      this.scene.start('Help');
    });

    // 键盘输入
    this.startKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.startKey!)) {
      this.startGame('single');
    }
  }

  private startGame(mode: string) {
    console.log('开始游戏，模式:', mode);
    this.scene.start('CharacterSelect', { mode });
  }
}
