import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config';
import { Fighter } from '../entities/Fighter';
import { FighterType, FIGHTER_DATA } from '../data/fighters';
import { EffectManager } from '../systems/EffectManager';
import { FighterAI, AIDifficulty } from '../systems/FighterAI';
import { SoundManager, SoundType } from '../systems/SoundManager';

export class FightScene extends Phaser.Scene {
  private mode?: string;
  private characterIndex?: number;

  private fighters: Fighter[] = [];
  private player1?: Fighter;
  private player2?: Fighter;

  // 特效管理器
  private effectManager?: EffectManager;

  // 音效管理器
  private soundManager?: SoundManager;

  // AI控制器
  private aiControllers: Map<Fighter, FighterAI> = new Map();

  // 血条UI元素
  private healthBars: Map<Fighter, Phaser.GameObjects.Graphics> = new Map();
  private comboTexts: Map<Fighter, Phaser.GameObjects.Text> = new Map();

  // 输入控制
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player1Attack?: {
    punch: Phaser.Input.Keyboard.Key;
    kick: Phaser.Input.Keyboard.Key;
  };
  private player2Attack?: {
    punch: Phaser.Input.Keyboard.Key;
    kick: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'Fight' });
  }

  init(data: { mode: string; characterIndex: number }) {
    this.mode = data.mode;
    this.characterIndex = data.characterIndex;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 初始化特效管理器
    this.effectManager = new EffectManager(this);

    // 初始化音效管理器
    this.soundManager = new SoundManager(this);
    this.soundManager.playBGM();

    // 竞技场背景
    this.createArena();

    // 创建玩家
    this.createPlayers();

    // UI
    this.createUI();

    // 输入处理
    this.setupInput();

    // 碰撞检测
    this.setupCollisions();

    console.log('战斗场景已创建 - 角色系统已激活');
  }

  private createArena() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景渐变（天空到地面）
    const graphics = this.add.graphics();

    // 天空部分
    graphics.fillGradientStyle(0x4a90e2, 0x4a90e2, 0x357abd, 0x357abd, 1);
    graphics.fillRect(0, 0, width, height * 0.6);

    // 地面部分
    graphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x6b5344, 0x6b5344, 1);
    graphics.fillRect(0, height * 0.6, width, height * 0.4);

    const { ARENA_WIDTH, ARENA_HEIGHT, ARENA_PADDING_X, ARENA_PADDING_Y } = GAME_CONSTANTS;

    // 竞技场主体地板
    const floorY = ARENA_PADDING_Y + ARENA_HEIGHT - 10;

    // 地板阴影
    const floorShadow = this.add.rectangle(
      this.cameras.main.centerX,
      floorY + 2,
      ARENA_WIDTH,
      20,
      0x000000,
      0.2
    );

    // 地板主体
    const floor = this.add.rectangle(
      this.cameras.main.centerX,
      floorY,
      ARENA_WIDTH,
      20,
      0xd4a574
    );

    // 地板纹理线
    const floorLines = this.add.graphics();
    floorLines.lineStyle(1, 0xc09060, 0.5);
    for (let i = 0; i < 10; i++) {
      const x = this.cameras.main.centerX - ARENA_WIDTH / 2 + (ARENA_WIDTH / 10) * i;
      floorLines.lineBetween(x, floorY - 10, x, floorY + 10);
    }

    // 竞技场边界
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(3, 0xffffff, 0.8);
    borderGraphics.strokeRect(
      this.cameras.main.centerX - ARENA_WIDTH / 2,
      ARENA_PADDING_Y,
      ARENA_WIDTH,
      ARENA_HEIGHT
    );

    // 内层边界
    borderGraphics.lineStyle(2, 0xffff00, 0.3);
    borderGraphics.strokeRect(
      this.cameras.main.centerX - ARENA_WIDTH / 2 + 5,
      ARENA_PADDING_Y + 5,
      ARENA_WIDTH - 10,
      ARENA_HEIGHT - 10
    );

    // 中心圆
    const centerCircle = this.add.circle(
      this.cameras.main.centerX,
      ARENA_PADDING_Y + ARENA_HEIGHT / 2,
      30,
      0x000000,
      0
    );
    centerCircle.setStrokeStyle(2, 0xffffff, 0.5);

    // 中心点
    this.add.circle(
      this.cameras.main.centerX,
      ARENA_PADDING_Y + ARENA_HEIGHT / 2,
      3,
      0xffffff,
      0.7
    );

    // 角落装饰
    this.createCornerDecoration(
      this.cameras.main.centerX - ARENA_WIDTH / 2 + 10,
      ARENA_PADDING_Y + 10
    );
    this.createCornerDecoration(
      this.cameras.main.centerX + ARENA_WIDTH / 2 - 10,
      ARENA_PADDING_Y + 10
    );
    this.createCornerDecoration(
      this.cameras.main.centerX - ARENA_WIDTH / 2 + 10,
      ARENA_PADDING_Y + ARENA_HEIGHT - 10
    );
    this.createCornerDecoration(
      this.cameras.main.centerX + ARENA_WIDTH / 2 - 10,
      ARENA_PADDING_Y + ARENA_HEIGHT - 10
    );
  }

  private createCornerDecoration(x: number, y: number) {
    const decoration = this.add.graphics();
    decoration.fillStyle(0xffff00, 0.3);
    decoration.fillCircle(x, y, 4);
    decoration.lineStyle(1, 0xffffff, 0.5);
    decoration.strokeCircle(x, y, 4);
  }

  private createPlayers() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // 获取角色类型
    const fighterTypes = Object.keys(FIGHTER_DATA) as FighterType[];
    const selectedType = fighterTypes[this.characterIndex || 0];

    // 玩家1（左侧）
    this.player1 = new Fighter(this, centerX - 50, centerY, selectedType);
    this.fighters.push(this.player1);

    // 玩家2或AI（右侧）
    const player2Type = fighterTypes[(this.characterIndex || 0 + 1) % fighterTypes.length];
    this.player2 = new Fighter(this, centerX + 50, centerY, player2Type);
    this.fighters.push(this.player2);

    // 单人模式：为Player2添加AI
    if (this.mode === 'single') {
      const ai = new FighterAI(this, this.player2, this.player1, AIDifficulty.NORMAL);
      this.aiControllers.set(this.player2, ai);
    }

    // 根据模式创建更多玩家
    if (this.mode === 'vs_4p') {
      const player3Type = fighterTypes[(this.characterIndex || 0 + 2) % fighterTypes.length];
      const player3 = new Fighter(this, centerX - 50, centerY - 40, player3Type);
      this.fighters.push(player3);

      const player4Type = fighterTypes[(this.characterIndex || 0 + 3) % fighterTypes.length];
      const player4 = new Fighter(this, centerX + 50, centerY - 40, player4Type);
      this.fighters.push(player4);

      // 4人模式：为Player3和Player4添加AI
      const ai3 = new FighterAI(this, player3, this.player1, AIDifficulty.EASY);
      this.aiControllers.set(player3, ai3);

      const ai4 = new FighterAI(this, player4, this.player1, AIDifficulty.EASY);
      this.aiControllers.set(player4, ai4);
    }
  }

  private createUI() {
    const width = this.cameras.main.width;

    // 顶部UI区域
    const uiBox = this.add.rectangle(width / 2, 10, width - 20, 16, 0x000000, 0.7);

    // 时间显示
    this.add.text(width / 2, 10, 'TIME: 99', {
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 为每个角色创建血条和连击显示
    if (this.player1) {
      this.createHealthBarUI(this.player1, 10, 5, 'P1');
      this.createComboText(this.player1);
    }

    if (this.player2) {
      this.createHealthBarUI(this.player2, width - 70, 5, 'P2');
      this.createComboText(this.player2);
    }

    // 暂停提示
    this.add.text(width / 2, 230, 'ESC: 返回菜单', {
      fontSize: '8px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private createHealthBarUI(fighter: Fighter, x: number, y: number, label: string) {
    const data = FIGHTER_DATA[Object.keys(FIGHTER_DATA)[this.fighters.indexOf(fighter)] as FighterType];

    // 血条背景
    this.add.rectangle(x + 25, y + 5, 50, 8, 0x333333);

    // 血条
    const healthBar = this.add.graphics();
    this.healthBars.set(fighter, healthBar);

    // 玩家标签
    this.add.text(x, y + 5, label, {
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // 初始绘制
    this.updateHealthBar(fighter);
  }

  private updateHealthBar(fighter: Fighter) {
    const healthBar = this.healthBars.get(fighter);
    if (!healthBar) return;

    const fighterIndex = this.fighters.indexOf(fighter);
    const data = FIGHTER_DATA[Object.keys(FIGHTER_DATA)[fighterIndex] as FighterType];
    const width = this.cameras.main.width;
    const x = fighterIndex === 0 ? 10 : width - 70;
    const y = 5;

    const hpPercent = fighter.getHp() / fighter.getMaxHp();
    const barWidth = 48 * hpPercent;

    // 血条颜色根据血量变化
    let color = 0x00ff00; // 绿色
    if (hpPercent < 0.3) {
      color = 0xff0000; // 红色
    } else if (hpPercent < 0.6) {
      color = 0xffaa00; // 橙色
    }

    healthBar.clear();
    healthBar.fillStyle(color);
    healthBar.fillRect(x + 1, y + 1, barWidth, 6);
  }

  private createComboText(fighter: Fighter) {
    const comboText = this.add.text(fighter.x, fighter.y - 30, '', {
      fontSize: '12px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    comboText.setOrigin(0.5);
    comboText.setVisible(false);
    this.comboTexts.set(fighter, comboText);
  }

  private updateComboDisplay(fighter: Fighter) {
    const comboText = this.comboTexts.get(fighter);
    if (!comboText) return;

    const combo = fighter.getComboCount();
    if (combo > 1) {
      comboText.setText(`${combo} HIT COMBO!`);
      comboText.setPosition(fighter.x, fighter.y - 35);
      comboText.setVisible(true);
    } else {
      comboText.setVisible(false);
    }
  }

  private createHealthBar(x: number, y: number, color: number, label: string) {
    // 旧方法，保留以防需要
  }

  private setupInput() {
    // ESC返回菜单
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.scene.start('Title');
    });

    // 玩家1控制 - WASD移动
    if (this.input.keyboard) {
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };

      // 玩家1攻击 - J拳，K踢
      this.player1Attack = {
        punch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        kick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)
      };

      // 跳跃 - J+K同时按
      this.player1Attack.punch.on('down', () => {
        if (this.player1Attack!.kick.isDown) {
          this.player1?.jump();
        } else {
          this.player1?.punch();
        }
      });

      this.player1Attack.kick.on('down', () => {
        if (this.player1Attack!.punch.isDown) {
          this.player1?.jump();
        } else {
          this.player1?.kick();
        }
      });

      // 玩家2控制 - 方向键移动
      this.cursors = this.input.keyboard.createCursorKeys();

      // 玩家2攻击 - 数字键1拳，2踢
      this.player2Attack = {
        punch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        kick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
      };

      this.player2Attack.punch.on('down', () => {
        if (this.player2Attack!.kick.isDown) {
          this.player2?.jump();
        } else {
          this.player2?.punch();
        }
      });

      this.player2Attack.kick.on('down', () => {
        if (this.player2Attack!.punch.isDown) {
          this.player2?.jump();
        } else {
          this.player2?.kick();
        }
      });
    }
  }

  private setupCollisions() {
    // 角色之间的碰撞
    for (let i = 0; i < this.fighters.length; i++) {
      for (let j = i + 1; j < this.fighters.length; j++) {
        this.physics.add.collider(this.fighters[i], this.fighters[j]);
      }
    }
  }

  update(time: number, delta: number) {
    // 更新所有角色
    this.fighters.forEach(fighter => {
      fighter.update(delta);
      this.updateHealthBar(fighter);
      this.updateComboDisplay(fighter);
    });

    // 更新AI控制器
    this.aiControllers.forEach((ai, fighter) => {
      ai.update(delta);
    });

    // 玩家1输入处理
    if (this.player1 && this.wasd) {
      const moveX = (this.wasd.right.isDown ? 1 : 0) - (this.wasd.left.isDown ? 1 : 0);
      const moveY = (this.wasd.down.isDown ? 1 : 0) - (this.wasd.up.isDown ? 1 : 0);
      this.player1.move(moveX, moveY);

      // 移动时产生灰尘特效
      if ((moveX !== 0 || moveY !== 0) && Math.random() < 0.1) {
        this.effectManager?.createDustEffect(this.player1.x, this.player1.y + 10);
      }
    }

    // 玩家2输入处理（仅在双人模式）
    if (this.player2 && this.cursors && this.mode !== 'single') {
      const moveX = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
      const moveY = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
      this.player2.move(moveX, moveY);

      if ((moveX !== 0 || moveY !== 0) && Math.random() < 0.1) {
        this.effectManager?.createDustEffect(this.player2.x, this.player2.y + 10);
      }
    }

    // 攻击判定
    this.checkAttackCollisions();

    // 检查胜负
    this.checkVictory();
  }

  private checkAttackCollisions() {
    for (let i = 0; i < this.fighters.length; i++) {
      const attacker = this.fighters[i];
      const attackBox = attacker.getAttackBox();

      if (!attackBox) continue;

      for (let j = 0; j < this.fighters.length; j++) {
        if (i === j) continue;

        const target = this.fighters[j];
        const targetBounds = new Phaser.Geom.Rectangle(
          target.x - 8,
          target.y - 12,
          16,
          24
        );

        if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, targetBounds)) {
          const power = attacker.getAttackPower();
          const facing = attacker.getFacing();
          const hitSuccess = target.takeDamage(power, facing * 100, 0);

          if (hitSuccess) {
            // 打击音效
            this.soundManager?.play(SoundType.HIT);

            // 打击特效
            this.effectManager?.createHitEffect(target.x, target.y);

            // 伤害数字
            const isCritical = attacker.getComboCount() > 3;
            this.effectManager?.createDamageText(target.x, target.y - 10, power, isCritical);

            // 连击音效
            if (isCritical) {
              this.soundManager?.play(SoundType.COMBO);
            }

            // 屏幕震动
            this.effectManager?.shakeScreen(isCritical ? 8 : 4);

            // 检查是否KO
            if (!target.isAlive()) {
              this.soundManager?.play(SoundType.KO);
              this.effectManager?.createKnockoutEffect(target.x, target.y);
              attacker.resetCombo();
            }
          }
        }
      }
    }
  }

  private checkVictory() {
    const aliveFighters = this.fighters.filter(f => f.isAlive());

    // 只剩一个角色存活
    if (aliveFighters.length === 1) {
      const winner = aliveFighters[0];
      this.showVictory(winner);
    }

    // 全部KO（平局）
    if (aliveFighters.length === 0) {
      this.showDraw();
    }
  }

  private showVictory(winner: Fighter) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 暂停游戏
    this.aiControllers.clear();

    // 停止BGM，播放胜利音效
    this.soundManager?.stopBGM();
    this.soundManager?.play(SoundType.VICTORY);

    // 胜利文字
    const winText = this.add.text(width / 2, height / 2 - 20, 'VICTORY!', {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    winText.setOrigin(0.5);
    winText.setAlpha(0);

    this.tweens.add({
      targets: winText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 2
    });

    // 提示文字
    this.time.delayedCall(2000, () => {
      const restartText = this.add.text(width / 2, height / 2 + 30, 'Press ENTER to continue', {
        fontSize: '12px',
        color: '#ffffff'
      });
      restartText.setOrigin(0.5);

      const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey?.once('down', () => {
        this.scene.start('Title');
      });
    });
  }

  private showDraw() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const drawText = this.add.text(width / 2, height / 2, 'DRAW', {
      fontSize: '32px',
      color: '#888888',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    drawText.setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.scene.start('Title');
    });
  }
}
