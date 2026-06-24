import Phaser from 'phaser';

// 游戏配置 - 基于原版FC的分辨率
export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 256,  // FC原版分辨率
  height: 240, // FC原版分辨率
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 3  // 3倍放大，保持像素风格
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },  // 无重力，格斗游戏
      debug: false
    }
  },
  render: {
    pixelArt: true,  // 保持像素风格
    antialias: false
  },
  backgroundColor: '#000000'
};

// 游戏常量
export const GAME_CONSTANTS = {
  // 屏幕尺寸
  SCREEN_WIDTH: 256,
  SCREEN_HEIGHT: 240,

  // 竞技场尺寸
  ARENA_WIDTH: 240,
  ARENA_HEIGHT: 200,
  ARENA_PADDING_X: 8,
  ARENA_PADDING_Y: 20,

  // 玩家数量
  MAX_PLAYERS: 4,

  // 游戏模式
  GAME_MODE: {
    SINGLE: 'single',    // 单人模式
    VS_2P: 'vs_2p',      // 双人对战
    VS_4P: 'vs_4p',      // 四人混战
    TEAM_2V2: 'team_2v2' // 2v2队伍战
  }
};
