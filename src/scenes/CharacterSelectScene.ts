import Phaser from 'phaser';
import { FIGHTER_DATA, FighterType } from '../data/fighters';

export class CharacterSelectScene extends Phaser.Scene {
  private mode?: string;
  private currentPage: number = 0;
  private charactersPerPage: number = 4;

  constructor() {
    super({ key: 'CharacterSelect' });
  }

  init(data: { mode: string }) {
    this.mode = data.mode;
    this.currentPage = 0;
  }

  create() {
    this.drawCharacterSelect();
  }

  private drawCharacterSelect() {
    // 清除之前的内容
    this.children.removeAll();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景渐变
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a2a4a, 0x2a2a4a, 0x1a1a3a, 0x1a1a3a, 1);
    bg.fillRect(0, 0, width, height);

    // 标题背景
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.6);
    titleBox.fillRoundedRect(width / 2 - 80, 10, 160, 35, 5);
    titleBox.lineStyle(2, 0xffff00, 1);
    titleBox.strokeRoundedRect(width / 2 - 80, 10, 160, 35, 5);

    // 标题
    const title = this.add.text(width / 2, 20, '选择角色', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    title.setOrigin(0.5);

    // 游戏模式提示
    const modeText = this.mode === 'single' ? '单人模式' :
                     this.mode === 'vs_2p' ? '双人对战' : '四人混战';
    this.add.text(width / 2, 37, `模式: ${modeText}`, {
      fontSize: '9px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // 获取所有角色
    const allCharacters = Object.keys(FIGHTER_DATA) as FighterType[];
    const totalPages = Math.ceil(allCharacters.length / this.charactersPerPage);

    // 当前页的角色
    const startIndex = this.currentPage * this.charactersPerPage;
    const endIndex = Math.min(startIndex + this.charactersPerPage, allCharacters.length);
    const pageCharacters = allCharacters.slice(startIndex, endIndex);

    // 页码显示
    if (totalPages > 1) {
      this.add.text(width / 2, 50, `第 ${this.currentPage + 1}/${totalPages} 页`, {
        fontSize: '8px',
        color: '#888888'
      }).setOrigin(0.5);
    }

    const startY = 65;
    const spacing = 38;

    pageCharacters.forEach((charKey, index) => {
      const char = FIGHTER_DATA[charKey];
      const globalIndex = startIndex + index;
      const y = startY + index * spacing;

      // 角色卡片背景
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x000000, 0.4);
      cardBg.fillRoundedRect(width / 2 - 105, y - 15, 210, 32, 5);

      // 角色框
      const box = this.add.rectangle(width / 2, y, 200, 28, char.color, 0.3);
      box.setStrokeStyle(2, char.color);
      box.setInteractive();

      // 角色头像（简化的像素风格）
      const avatar = this.add.graphics();
      avatar.fillStyle(char.color);
      avatar.fillCircle(width / 2 - 85, y, 10);
      avatar.lineStyle(2, 0xffffff, 0.8);
      avatar.strokeCircle(width / 2 - 85, y, 10);
      // 眼睛
      avatar.fillStyle(0xffffff);
      avatar.fillCircle(width / 2 - 88, y - 2, 2);
      avatar.fillCircle(width / 2 - 82, y - 2, 2);

      // 角色名（中文）
      const nameText = this.add.text(width / 2 - 60, y - 8, char.name, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0);

      // 角色名（英文）
      const nameEnText = this.add.text(width / 2 - 60, y + 5, char.nameEn, {
        fontSize: '9px',
        color: '#cccccc'
      }).setOrigin(0, 0);

      // 属性标签
      const stats = char.stats;
      const typeLabel = this.add.text(width / 2 + 55, y, `HP:${stats.maxHp} SPD:${stats.speed}`, {
        fontSize: '7px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 3, y: 1 }
      }).setOrigin(0.5);

      // 快捷键提示（只显示前4个）
      if (index < 4) {
        const keyHint = this.add.text(width / 2 + 90, y, `[${index + 1}]`, {
          fontSize: '10px',
          color: '#888888'
        }).setOrigin(0.5);
      }

      // 鼠标悬停效果
      box.on('pointerover', () => {
        box.setFillStyle(char.color, 0.6);
        box.setStrokeStyle(3, char.color);
        avatar.setScale(1.1);
        nameText.setScale(1.05);
      });

      box.on('pointerout', () => {
        box.setFillStyle(char.color, 0.3);
        box.setStrokeStyle(2, char.color);
        avatar.setScale(1);
        nameText.setScale(1);
      });

      box.on('pointerdown', () => {
        this.selectCharacter(globalIndex);
      });

      // 键盘快捷键（只为前4个角色）
      if (index < 4) {
        const key = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + index);
        key?.on('down', () => this.selectCharacter(globalIndex));
      }
    });

    // 翻页按钮
    if (totalPages > 1) {
      // 上一页
      if (this.currentPage > 0) {
        const prevBtn = this.add.text(20, height / 2, '< 上一页', {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 5, y: 3 }
        });
        prevBtn.setInteractive();
        prevBtn.on('pointerdown', () => {
          this.currentPage--;
          this.drawCharacterSelect();
        });
      }

      // 下一页
      if (this.currentPage < totalPages - 1) {
        const nextBtn = this.add.text(width - 20, height / 2, '下一页 >', {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 5, y: 3 }
        }).setOrigin(1, 0.5);
        nextBtn.setInteractive();
        nextBtn.on('pointerdown', () => {
          this.currentPage++;
          this.drawCharacterSelect();
        });
      }
    }

    // 提示文字框
    const hintBox = this.add.rectangle(width / 2, height - 30, width - 20, 25, 0x000000, 0.5);
    hintBox.setStrokeStyle(1, 0xffffff, 0.3);

    this.add.text(width / 2, height - 30, '按数字键1-4或点击选择角色 | ESC返回', {
      fontSize: '9px',
      color: '#888888'
    }).setOrigin(0.5);

    // ESC返回
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.once('down', () => {
      this.scene.start('Title');
    });
  }
  private selectCharacter(index: number) {
    console.log('选择了角色:', index);
    this.scene.start('Fight', { mode: this.mode, characterIndex: index });
  }
}
