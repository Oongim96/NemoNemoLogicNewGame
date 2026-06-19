import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { RunState } from '@modules/run';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const stats = this.registry.get('dataStats') as {
      totalCards: number;
      totalThresholds: number;
    };

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 120, '픽셀 던전', {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 175, '잉크 오브 운명', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        240,
        `네모네모 × 덱빌드 × 자동전투\n카드 ${stats.totalCards}장 · 3×3 맵 런 플레이 가능`,
        {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#8888aa',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const startBtn = this.add
      .rectangle(GAME_WIDTH / 2, 360, 220, 52, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 360, '런 시작', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x9b7fff));
    startBtn.on('pointerout', () => startBtn.setFillStyle(COLORS.accent));
    startBtn.on('pointerdown', () => {
      this.registry.set('runState', RunState.createFresh());
      this.scene.start('MapScene');
    });
  }
}
