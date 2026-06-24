// 角色属性接口
export interface FighterStats {
  maxHp: number;
  speed: number;
  punchPower: number;
  kickPower: number;
  defense: number;
}

// 角色状态
export enum FighterState {
  IDLE = 'idle',
  WALK = 'walk',
  PUNCH = 'punch',
  KICK = 'kick',
  JUMP = 'jump',
  HIT = 'hit',
  DOWN = 'down',
  KO = 'ko'
}

// 角色数据配置
export const FIGHTER_DATA = {
  kunio: {
    name: '国夫',
    nameEn: 'KUNIO',
    color: 0xff6b6b,
    stats: {
      maxHp: 100,
      speed: 80,
      punchPower: 10,
      kickPower: 12,
      defense: 8
    }
  },
  riki: {
    name: '力',
    nameEn: 'RIKI',
    color: 0x4ecdc4,
    stats: {
      maxHp: 110,
      speed: 75,
      punchPower: 12,
      kickPower: 10,
      defense: 10
    }
  },
  godai: {
    name: '五代',
    nameEn: 'GODAI',
    color: 0xffe66d,
    stats: {
      maxHp: 90,
      speed: 90,
      punchPower: 8,
      kickPower: 14,
      defense: 6
    }
  },
  kobayashi: {
    name: '小林',
    nameEn: 'KOBAYASHI',
    color: 0x95e1d3,
    stats: {
      maxHp: 95,
      speed: 85,
      punchPower: 11,
      kickPower: 11,
      defense: 7
    }
  },
  // 新增角色
  misuzu: {
    name: '美铃',
    nameEn: 'MISUZU',
    color: 0xff69b4,
    stats: {
      maxHp: 85,
      speed: 95,
      punchPower: 9,
      kickPower: 13,
      defense: 5
    }
  },
  hayato: {
    name: '隼人',
    nameEn: 'HAYATO',
    color: 0x9370db,
    stats: {
      maxHp: 105,
      speed: 70,
      punchPower: 13,
      kickPower: 9,
      defense: 9
    }
  },
  ryuichi: {
    name: '龙一',
    nameEn: 'RYUICHI',
    color: 0xff8c00,
    stats: {
      maxHp: 100,
      speed: 85,
      punchPower: 10,
      kickPower: 10,
      defense: 8
    }
  },
  takeshi: {
    name: '武',
    nameEn: 'TAKESHI',
    color: 0x32cd32,
    stats: {
      maxHp: 115,
      speed: 65,
      punchPower: 14,
      kickPower: 8,
      defense: 11
    }
  }
};

export type FighterType = keyof typeof FIGHTER_DATA;
