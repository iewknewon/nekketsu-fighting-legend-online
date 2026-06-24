import Phaser from 'phaser';
import { FighterStats, FighterState, FIGHTER_DATA, FighterType } from '../data/fighters';

export class Fighter extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;

  private fighterType: FighterType;
  private stats: FighterStats;
  private hp: number;
  private state: FighterState = FighterState.IDLE;

  private velocity: Phaser.Math.Vector2;
  private facing: 1 | -1 = 1; // 1 = 右, -1 = 左

  // 攻击判定
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;

  // 受击判定
  private isInvincible: boolean = false;
  private invincibleTime: number = 0;

  // 连击系统
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private lastAttackTime: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    fighterType: FighterType
  ) {
    super(scene, x, y);

    this.fighterType = fighterType;
    const data = FIGHTER_DATA[fighterType];
    this.stats = data.stats;
    this.hp = this.stats.maxHp;

    this.velocity = new Phaser.Math.Vector2(0, 0);

    // 创建角色图形（暂时用矩形）
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawCharacter();

    // 角色名字标签
    this.nameText = scene.add.text(0, -20, data.name, {
      fontSize: '8px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 2, y: 1 }
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    scene.add.existing(this);

    // 添加物理体
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 24);
    body.setCollideWorldBounds(true);
  }

  private drawCharacter() {
    const data = FIGHTER_DATA[this.fighterType];
    this.graphics.clear();

    const isFlipped = this.facing === -1;
    const flipMultiplier = isFlipped ? -1 : 1;

    // 根据状态绘制不同的角色姿态
    if (this.state === FighterState.HIT) {
      this.drawHitPose(data.color, flipMultiplier);
    } else if (this.state === FighterState.PUNCH) {
      this.drawPunchPose(data.color, flipMultiplier);
    } else if (this.state === FighterState.KICK) {
      this.drawKickPose(data.color, flipMultiplier);
    } else if (this.state === FighterState.JUMP) {
      this.drawJumpPose(data.color, flipMultiplier);
    } else if (this.state === FighterState.WALK) {
      this.drawWalkPose(data.color, flipMultiplier);
    } else {
      this.drawIdlePose(data.color, flipMultiplier);
    }
  }

  // 站立姿态
  private drawIdlePose(color: number, flip: number) {
    // 头部
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(0, -8, 4);

    // 身体
    this.graphics.fillRect(-3, -4, 6, 8);

    // 腿
    this.graphics.fillRect(-3, 4, 2, 6);
    this.graphics.fillRect(1, 4, 2, 6);

    // 手臂
    this.graphics.fillRect(-4 * flip, -2, 2, 6);
    this.graphics.fillRect(2 * flip, -2, 2, 6);

    // 眼睛（朝向指示）
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(1.5 * flip, -8, 1);

    // 边框
    this.graphics.lineStyle(1, 0x000000, 0.5);
    this.graphics.strokeCircle(0, -8, 4);
    this.graphics.strokeRect(-3, -4, 6, 8);
  }

  // 行走姿态
  private drawWalkPose(color: number, flip: number) {
    const walkCycle = Math.sin(Date.now() / 100);

    // 头部
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(0, -8, 4);

    // 身体（轻微晃动）
    this.graphics.fillRect(-3, -4 + walkCycle * 0.5, 6, 8);

    // 腿（交替移动）
    this.graphics.fillRect(-3, 4, 2, 6 + walkCycle);
    this.graphics.fillRect(1, 4, 2, 6 - walkCycle);

    // 手臂（摆动）
    this.graphics.fillRect(-4 * flip, -2 + walkCycle, 2, 6);
    this.graphics.fillRect(2 * flip, -2 - walkCycle, 2, 6);

    // 眼睛
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(1.5 * flip, -8, 1);
  }

  // 出拳姿态
  private drawPunchPose(color: number, flip: number) {
    // 头部
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(-1 * flip, -8, 4);

    // 身体（前倾）
    this.graphics.fillRect(-3, -4, 6, 8);

    // 腿
    this.graphics.fillRect(-4, 4, 2, 6);
    this.graphics.fillRect(0, 4, 2, 6);

    // 出拳的手臂（伸出）
    this.graphics.fillStyle(color);
    this.graphics.fillRect(3 * flip, -2, 8 * flip, 3);

    // 另一只手臂（收回）
    this.graphics.fillRect(-4 * flip, 0, 2, 5);

    // 拳头
    this.graphics.fillCircle(11 * flip, -1, 2);

    // 眼睛
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(0.5 * flip, -8, 1);
  }

  // 踢腿姿态
  private drawKickPose(color: number, flip: number) {
    // 头部
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(-2 * flip, -9, 4);

    // 身体（后仰）
    this.graphics.fillRect(-4, -5, 6, 8);

    // 支撑腿
    this.graphics.fillRect(-4, 3, 2, 7);

    // 踢出的腿
    this.graphics.fillRect(0, 0, 10 * flip, 3);
    this.graphics.fillCircle(10 * flip, 1, 2);

    // 手臂（保持平衡）
    this.graphics.fillRect(-5 * flip, -4, 2, 6);
    this.graphics.fillRect(2 * flip, -1, 2, 4);

    // 眼睛
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(-0.5 * flip, -9, 1);
  }

  // 跳跃姿态
  private drawJumpPose(color: number, flip: number) {
    // 头部
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(0, -8, 4);

    // 身体（卷曲）
    this.graphics.fillRect(-3, -4, 6, 6);

    // 腿（收起）
    this.graphics.fillRect(-3, 2, 2, 4);
    this.graphics.fillRect(1, 2, 2, 4);

    // 手臂（上举）
    this.graphics.fillRect(-4 * flip, -8, 2, 5);
    this.graphics.fillRect(2 * flip, -8, 2, 5);

    // 眼睛
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(1 * flip, -8, 1);
  }

  // 受击姿态
  private drawHitPose(color: number, flip: number) {
    // 头部（后仰）
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(-2 * flip, -9, 4);

    // 身体（弯曲）
    this.graphics.fillRect(-4, -5, 6, 9);

    // 腿（不稳）
    this.graphics.fillRect(-4, 4, 2, 5);
    this.graphics.fillRect(1, 4, 2, 6);

    // 手臂（防御姿态）
    this.graphics.fillRect(-5 * flip, -3, 2, 5);
    this.graphics.fillRect(1 * flip, -3, 2, 5);

    // 眼睛（痛苦表情）
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(-1 * flip, -9, 1);
  }

  update(delta: number) {
    // 更新冷却时间
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.invincibleTime > 0) {
      this.invincibleTime -= delta;
      if (this.invincibleTime <= 0) {
        this.isInvincible = false;
      }
      // 无敌时闪烁
      this.alpha = Math.sin(this.invincibleTime / 50) > 0 ? 1 : 0.5;
    } else {
      this.alpha = 1;
    }

    // 连击计时器
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 应用移动
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);

    // 重置速度（每帧由输入系统设置）
    this.velocity.set(0, 0);

    // 更新图形
    this.drawCharacter();
  }

  // 移动控制
  move(x: number, y: number) {
    if (this.state === FighterState.HIT || this.state === FighterState.DOWN) {
      return;
    }

    const speed = this.stats.speed;
    this.velocity.x = x * speed;
    this.velocity.y = y * speed;

    // 更新朝向
    if (x !== 0) {
      this.facing = x > 0 ? 1 : -1;
    }

    this.state = (x !== 0 || y !== 0) ? FighterState.WALK : FighterState.IDLE;
  }

  // 出拳
  punch() {
    if (this.canAttack()) {
      this.state = FighterState.PUNCH;
      this.isAttacking = true;
      this.attackCooldown = 300; // 300ms冷却

      // 更新连击
      this.updateCombo();

      // 攻击动画（简单的闪烁效果）
      this.scene.tweens.add({
        targets: this.graphics,
        scaleX: 1.2,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.isAttacking = false;
          this.state = FighterState.IDLE;
        }
      });

      return true;
    }
    return false;
  }

  // 踢腿
  kick() {
    if (this.canAttack()) {
      this.state = FighterState.KICK;
      this.isAttacking = true;
      this.attackCooldown = 400; // 400ms冷却

      // 更新连击
      this.updateCombo();

      this.scene.tweens.add({
        targets: this.graphics,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        onComplete: () => {
          this.isAttacking = false;
          this.state = FighterState.IDLE;
        }
      });

      return true;
    }
    return false;
  }

  // 更新连击计数
  private updateCombo() {
    const now = Date.now();
    if (now - this.lastAttackTime < 1000) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastAttackTime = now;
    this.comboTimer = 1000; // 1秒内继续攻击才算连击
  }

  // 跳跃
  jump() {
    if (this.state === FighterState.IDLE || this.state === FighterState.WALK) {
      this.state = FighterState.JUMP;

      this.scene.tweens.add({
        targets: this,
        y: this.y - 30,
        duration: 300,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: () => {
          this.state = FighterState.IDLE;
        }
      });

      return true;
    }
    return false;
  }

  // 受到攻击
  takeDamage(damage: number, knockbackX: number = 0, knockbackY: number = 0) {
    if (this.isInvincible || this.state === FighterState.DOWN) {
      return false;
    }

    // 计算实际伤害
    const actualDamage = Math.max(1, damage - this.stats.defense);
    this.hp = Math.max(0, this.hp - actualDamage);

    // 受击状态
    this.state = FighterState.HIT;
    this.isInvincible = true;
    this.invincibleTime = 1000; // 1秒无敌时间

    // 击退效果
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockbackX, knockbackY);

    // 受击闪红
    this.graphics.tint = 0xff0000;
    this.scene.time.delayedCall(200, () => {
      this.graphics.clearTint();
      this.state = this.hp > 0 ? FighterState.IDLE : FighterState.KO;
    });

    return true;
  }

  // 获取攻击判定框
  getAttackBox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking) {
      return null;
    }

    const range = this.state === FighterState.PUNCH ? 20 : 25;
    const offsetX = this.facing * 12;

    return new Phaser.Geom.Rectangle(
      this.x + offsetX - 10,
      this.y - 12,
      range,
      24
    );
  }

  // 获取攻击力
  getAttackPower(): number {
    if (this.state === FighterState.PUNCH) {
      return this.stats.punchPower;
    } else if (this.state === FighterState.KICK) {
      return this.stats.kickPower;
    }
    return 0;
  }

  private canAttack(): boolean {
    return this.attackCooldown <= 0 &&
           (this.state === FighterState.IDLE || this.state === FighterState.WALK);
  }

  // Getter方法
  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.stats.maxHp;
  }

  getState(): FighterState {
    return this.state;
  }

  getFacing(): 1 | -1 {
    return this.facing;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  getComboCount(): number {
    return this.comboCount;
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
  }
}
