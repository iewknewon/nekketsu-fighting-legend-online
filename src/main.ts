import Phaser from 'phaser';
import { GameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { FightScene } from './scenes/FightScene';
import { HelpScene } from './scenes/HelpScene';

// 创建游戏实例
const game = new Phaser.Game(GameConfig);

// 注册场景
game.scene.add('Boot', BootScene);
game.scene.add('Title', TitleScene);
game.scene.add('CharacterSelect', CharacterSelectScene);
game.scene.add('Fight', FightScene);
game.scene.add('Help', HelpScene);

// 启动游戏
game.scene.start('Boot');

export default game;
