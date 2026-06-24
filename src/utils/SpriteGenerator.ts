import Phaser from 'phaser';

// 程序化生成像素风格的角色精灵图
export class SpriteGenerator {
  static generateCharacterSprite(
    scene: Phaser.Scene,
    color: number,
    name: string
  ): Phaser.Textures.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // 将颜色转换为RGB
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const mainColor = `rgb(${r},${g},${b})`;
    const darkColor = `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`;
    const lightColor = `rgb(${Math.min(255, Math.floor(r * 1.2))},${Math.min(255, Math.floor(g * 1.2))},${Math.min(255, Math.floor(b * 1.2))})`;

    ctx.imageSmoothingEnabled = false;

    // 绘制站立姿态（帧0）
    this.drawStandingPose(ctx, 16, 16, mainColor, darkColor, lightColor);

    // 绘制行走姿态1（帧1）
    this.drawWalkPose1(ctx, 48, 16, mainColor, darkColor, lightColor);

    // 绘制行走姿态2（帧2）
    this.drawWalkPose2(ctx, 80, 16, mainColor, darkColor, lightColor);

    // 绘制攻击姿态（帧3）
    this.drawAttackPose(ctx, 112, 16, mainColor, darkColor, lightColor);

    // 创建纹理
    const texture = scene.textures.createCanvas(`character_${name}`, canvas.width, canvas.height);
    texture?.draw(0, 0, canvas);
    texture?.refresh();

    return texture!;
  }

  private static drawStandingPose(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    main: string,
    dark: string,
    light: string
  ) {
    // 头部
    ctx.fillStyle = main;
    ctx.fillRect(x - 3, y - 8, 6, 5);
    ctx.fillStyle = light;
    ctx.fillRect(x - 2, y - 7, 4, 2);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 6, 1, 1);
    ctx.fillRect(x + 1, y - 6, 1, 1);

    // 身体
    ctx.fillStyle = main;
    ctx.fillRect(x - 3, y - 3, 6, 7);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y - 3, 2, 7);

    // 手臂
    ctx.fillStyle = main;
    ctx.fillRect(x - 5, y - 2, 2, 5);
    ctx.fillRect(x + 3, y - 2, 2, 5);

    // 腿
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y + 4, 2, 6);
    ctx.fillRect(x + 1, y + 4, 2, 6);

    // 鞋子
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 3, y + 9, 2, 1);
    ctx.fillRect(x + 1, y + 9, 2, 1);
  }

  private static drawWalkPose1(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    main: string,
    dark: string,
    light: string
  ) {
    // 头部（略微前倾）
    ctx.fillStyle = main;
    ctx.fillRect(x - 2, y - 8, 6, 5);
    ctx.fillStyle = light;
    ctx.fillRect(x - 1, y - 7, 4, 2);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 1, y - 6, 1, 1);
    ctx.fillRect(x + 2, y - 6, 1, 1);

    // 身体
    ctx.fillStyle = main;
    ctx.fillRect(x - 3, y - 3, 6, 7);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y - 3, 2, 7);

    // 手臂（摆动）
    ctx.fillStyle = main;
    ctx.fillRect(x - 5, y - 1, 2, 4);
    ctx.fillRect(x + 3, y - 3, 2, 6);

    // 腿（前后迈步）
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y + 3, 2, 7);
    ctx.fillRect(x + 1, y + 5, 2, 5);

    // 鞋子
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 3, y + 9, 2, 1);
    ctx.fillRect(x + 1, y + 9, 2, 1);
  }

  private static drawWalkPose2(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    main: string,
    dark: string,
    light: string
  ) {
    // 头部
    ctx.fillStyle = main;
    ctx.fillRect(x - 3, y - 8, 6, 5);
    ctx.fillStyle = light;
    ctx.fillRect(x - 2, y - 7, 4, 2);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 6, 1, 1);
    ctx.fillRect(x + 1, y - 6, 1, 1);

    // 身体
    ctx.fillStyle = main;
    ctx.fillRect(x - 3, y - 3, 6, 7);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y - 3, 2, 7);

    // 手臂（摆动相反）
    ctx.fillStyle = main;
    ctx.fillRect(x - 5, y - 3, 2, 6);
    ctx.fillRect(x + 3, y - 1, 2, 4);

    // 腿（相反迈步）
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, y + 5, 2, 5);
    ctx.fillRect(x + 1, y + 3, 2, 7);

    // 鞋子
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 3, y + 9, 2, 1);
    ctx.fillRect(x + 1, y + 9, 2, 1);
  }

  private static drawAttackPose(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    main: string,
    dark: string,
    light: string
  ) {
    // 头部（后仰）
    ctx.fillStyle = main;
    ctx.fillRect(x - 4, y - 8, 6, 5);
    ctx.fillStyle = light;
    ctx.fillRect(x - 3, y - 7, 4, 2);

    // 眼睛（专注）
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 3, y - 6, 1, 1);
    ctx.fillRect(x, y - 6, 1, 1);

    // 身体（前倾）
    ctx.fillStyle = main;
    ctx.fillRect(x - 2, y - 3, 6, 7);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 2, y - 3, 2, 7);

    // 出拳手臂
    ctx.fillStyle = main;
    ctx.fillRect(x + 4, y - 2, 5, 2);
    ctx.fillStyle = light;
    ctx.fillRect(x + 9, y - 2, 2, 2);

    // 收回手臂
    ctx.fillStyle = main;
    ctx.fillRect(x - 6, y, 2, 3);

    // 腿（稳定站立）
    ctx.fillStyle = dark;
    ctx.fillRect(x - 2, y + 4, 2, 6);
    ctx.fillRect(x + 2, y + 4, 2, 6);

    // 鞋子
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y + 9, 2, 1);
    ctx.fillRect(x + 2, y + 9, 2, 1);
  }
}
