import Phaser from 'phaser';

// 特效类型
export enum EffectType {
  HIT = 'hit',           // 打击特效
  DAMAGE_TEXT = 'damage', // 伤害数字
  DUST = 'dust',         // 灰尘特效
  KNOCKOUT = 'knockout'   // KO特效
}

export class EffectManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 打击特效
  createHitEffect(x: number, y: number) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(x, y, 8);

    this.scene.tweens.add({
      targets: graphics,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        graphics.destroy();
      }
    });

    // 添加星星效果
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i;
      const star = this.scene.add.graphics();
      star.fillStyle(0xffff00, 1);
      star.fillStar(x, y, 4, 2, 4, 0);

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 20,
        y: y + Math.sin(angle) * 20,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          star.destroy();
        }
      });
    }
  }

  // 伤害数字
  createDamageText(x: number, y: number, damage: number, isCritical: boolean = false) {
    const text = this.scene.add.text(x, y, `-${damage}`, {
      fontSize: isCritical ? '16px' : '12px',
      color: isCritical ? '#ff0000' : '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  // 移动灰尘特效
  createDustEffect(x: number, y: number) {
    const dust = this.scene.add.graphics();
    dust.fillStyle(0xcccccc, 0.6);
    dust.fillCircle(x, y, 4);

    this.scene.tweens.add({
      targets: dust,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        dust.destroy();
      }
    });
  }

  // KO特效
  createKnockoutEffect(x: number, y: number) {
    const text = this.scene.add.text(x, y, 'K.O.', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            text.destroy();
          }
        });
      }
    });
  }

  // 屏幕震动
  shakeScreen(intensity: number = 4) {
    this.scene.cameras.main.shake(100, intensity / 1000);
  }
}
