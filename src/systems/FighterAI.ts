import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { FighterState } from '../data/fighters';

// AI难度等级
export enum AIDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard'
}

// AI行为状态
enum AIState {
  IDLE = 'idle',
  CHASE = 'chase',     // 追击
  ATTACK = 'attack',   // 攻击
  RETREAT = 'retreat', // 撤退
  CIRCLE = 'circle'    // 绕圈
}

export class FighterAI {
  private fighter: Fighter;
  private target: Fighter;
  private scene: Phaser.Scene;
  private difficulty: AIDifficulty;

  private aiState: AIState = AIState.IDLE;
  private stateTimer: number = 0;
  private reactionDelay: number = 0;
  private nextActionTime: number = 0;

  // AI参数
  private attackRange: number = 30;
  private retreatDistance: number = 60;
  private circleRadius: number = 50;

  constructor(
    scene: Phaser.Scene,
    fighter: Fighter,
    target: Fighter,
    difficulty: AIDifficulty = AIDifficulty.NORMAL
  ) {
    this.scene = scene;
    this.fighter = fighter;
    this.target = target;
    this.difficulty = difficulty;

    // 根据难度调整参数
    switch (difficulty) {
      case AIDifficulty.EASY:
        this.reactionDelay = 500;
        this.attackRange = 25;
        break;
      case AIDifficulty.NORMAL:
        this.reactionDelay = 300;
        this.attackRange = 30;
        break;
      case AIDifficulty.HARD:
        this.reactionDelay = 150;
        this.attackRange = 35;
        break;
    }
  }

  update(delta: number) {
    if (!this.target.isAlive() || !this.fighter.isAlive()) {
      return;
    }

    this.stateTimer += delta;

    // 反应延迟
    if (this.nextActionTime > 0) {
      this.nextActionTime -= delta;
      return;
    }

    // 根据状态执行行为
    switch (this.aiState) {
      case AIState.IDLE:
        this.handleIdle();
        break;
      case AIState.CHASE:
        this.handleChase();
        break;
      case AIState.ATTACK:
        this.handleAttack();
        break;
      case AIState.RETREAT:
        this.handleRetreat();
        break;
      case AIState.CIRCLE:
        this.handleCircle();
        break;
    }

    // 状态转换逻辑
    this.updateState();
  }

  private handleIdle() {
    // 待机状态，评估下一步行动
    const distance = this.getDistanceToTarget();

    if (distance > this.attackRange + 20) {
      this.changeState(AIState.CHASE);
    } else if (distance < this.attackRange) {
      this.changeState(AIState.ATTACK);
    }
  }

  private handleChase() {
    // 追击目标
    const distance = this.getDistanceToTarget();

    if (distance < this.attackRange) {
      this.changeState(AIState.ATTACK);
      return;
    }

    // 向目标移动
    this.moveTowardsTarget();

    // 偶尔跳跃接近
    if (Math.random() < 0.02 && distance > 40) {
      this.fighter.jump();
    }
  }

  private handleAttack() {
    const distance = this.getDistanceToTarget();

    // 如果目标太远，回到追击
    if (distance > this.attackRange + 10) {
      this.changeState(AIState.CHASE);
      return;
    }

    // 如果血量低，考虑撤退
    const hpPercent = this.fighter.getHp() / this.fighter.getMaxHp();
    if (hpPercent < 0.3 && Math.random() < 0.4) {
      this.changeState(AIState.RETREAT);
      return;
    }

    // 攻击决策
    const rand = Math.random();

    if (distance < this.attackRange * 0.8) {
      // 近距离，使用拳或踢
      if (rand < 0.5) {
        this.fighter.punch();
      } else {
        this.fighter.kick();
      }

      this.nextActionTime = this.reactionDelay;
    } else {
      // 稍远，移动接近
      this.moveTowardsTarget();
    }

    // 偶尔使用跳跃攻击
    if (Math.random() < 0.1) {
      this.fighter.jump();
    }
  }

  private handleRetreat() {
    // 撤退状态
    const distance = this.getDistanceToTarget();

    if (distance > this.retreatDistance) {
      // 撤退完成，切换到绕圈或追击
      if (Math.random() < 0.5) {
        this.changeState(AIState.CIRCLE);
      } else {
        this.changeState(AIState.CHASE);
      }
      return;
    }

    // 远离目标
    this.moveAwayFromTarget();

    // 撤退时偶尔跳跃
    if (Math.random() < 0.05) {
      this.fighter.jump();
    }
  }

  private handleCircle() {
    // 绕圈移动，寻找攻击机会
    const distance = this.getDistanceToTarget();

    if (distance < this.attackRange) {
      this.changeState(AIState.ATTACK);
      return;
    }

    if (distance > this.circleRadius + 30) {
      this.changeState(AIState.CHASE);
      return;
    }

    // 绕圈移动
    this.moveCircleAroundTarget();

    // 偶尔突然进攻
    if (Math.random() < 0.05) {
      this.changeState(AIState.ATTACK);
    }
  }

  private updateState() {
    // 根据情况自动切换状态
    const hpPercent = this.fighter.getHp() / this.fighter.getMaxHp();
    const targetHpPercent = this.target.getHp() / this.target.getMaxHp();

    // 血量低时更倾向于撤退
    if (hpPercent < 0.2 && this.aiState !== AIState.RETREAT && Math.random() < 0.3) {
      this.changeState(AIState.RETREAT);
    }

    // 目标血量低时更激进
    if (targetHpPercent < 0.3 && this.aiState === AIState.RETREAT) {
      this.changeState(AIState.CHASE);
    }
  }

  private changeState(newState: AIState) {
    this.aiState = newState;
    this.stateTimer = 0;
  }

  private getDistanceToTarget(): number {
    return Phaser.Math.Distance.Between(
      this.fighter.x,
      this.fighter.y,
      this.target.x,
      this.target.y
    );
  }

  private moveTowardsTarget() {
    const dx = this.target.x - this.fighter.x;
    const dy = this.target.y - this.fighter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const moveX = dx / distance;
      const moveY = dy / distance;
      this.fighter.move(moveX, moveY);
    } else {
      this.fighter.move(0, 0);
    }
  }

  private moveAwayFromTarget() {
    const dx = this.fighter.x - this.target.x;
    const dy = this.fighter.y - this.target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const moveX = dx / distance;
      const moveY = dy / distance;
      this.fighter.move(moveX, moveY);
    }
  }

  private moveCircleAroundTarget() {
    // 计算切线方向（垂直于连线）
    const dx = this.target.x - this.fighter.x;
    const dy = this.target.y - this.fighter.y;

    // 切线方向（顺时针）
    const moveX = -dy;
    const moveY = dx;
    const distance = Math.sqrt(moveX * moveX + moveY * moveY);

    if (distance > 0) {
      this.fighter.move(moveX / distance, moveY / distance);
    }
  }

  // 设置目标
  setTarget(target: Fighter) {
    this.target = target;
  }

  // 设置难度
  setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;

    switch (difficulty) {
      case AIDifficulty.EASY:
        this.reactionDelay = 500;
        this.attackRange = 25;
        break;
      case AIDifficulty.NORMAL:
        this.reactionDelay = 300;
        this.attackRange = 30;
        break;
      case AIDifficulty.HARD:
        this.reactionDelay = 150;
        this.attackRange = 35;
        break;
    }
  }
}
