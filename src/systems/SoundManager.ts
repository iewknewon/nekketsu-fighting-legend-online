import Phaser from 'phaser';

// 音效类型
export enum SoundType {
  PUNCH = 'punch',
  KICK = 'kick',
  HIT = 'hit',
  JUMP = 'jump',
  KO = 'ko',
  COMBO = 'combo',
  VICTORY = 'victory'
}

export class SoundManager {
  private scene: Phaser.Scene;
  private sounds: Map<SoundType, Phaser.Sound.BaseSound> = new Map();
  private bgm?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createSynthesizedSounds();
  }

  // 使用Web Audio API创建合成音效
  private createSynthesizedSounds() {
    // 由于没有音频文件，我们暂时用静音占位
    // 实际项目中这里应该加载真实音效文件
    console.log('音效系统已初始化（静音模式）');
  }

  // 播放音效
  play(soundType: SoundType, volume: number = 1) {
    // 这里可以播放对应的音效
    // 目前是静音模式，只记录日志
    console.log(`播放音效: ${soundType}`);
  }

  // 播放背景音乐
  playBGM(volume: number = 0.5, loop: boolean = true) {
    console.log('播放背景音乐');
  }

  // 停止背景音乐
  stopBGM() {
    if (this.bgm) {
      this.bgm.stop();
    }
  }

  // 设置音量
  setVolume(volume: number) {
    // 设置所有音效音量
    this.sounds.forEach(sound => {
      if ('setVolume' in sound) {
        (sound as any).setVolume(volume);
      }
    });
  }

  // 静音/取消静音
  mute(muted: boolean) {
    this.scene.sound.mute = muted;
  }
}
