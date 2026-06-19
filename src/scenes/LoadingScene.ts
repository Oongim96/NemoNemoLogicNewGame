import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { fillMobileBackground } from '@ui/mobile-shell';

export class LoadingScene extends Phaser.Scene {
  private barFill!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('LoadingScene');
  }

  create(): void {
    fillMobileBackground(this);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, '잉크 오브 운명', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stats = this.registry.get('dataStats') as { totalCards: number; totalThresholds: number };

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38 + 36, `카드 ${stats.totalCards}장 로드`, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    const barW = GAME_WIDTH - 80;
    const barY = GAME_HEIGHT * 0.5;
    this.add.rectangle(GAME_WIDTH / 2, barY, barW, 10, 0x2a2a3e);
    this.barFill = this.add
      .rectangle((GAME_WIDTH - barW) / 2 + 4, barY, 0, 6, COLORS.accent)
      .setOrigin(0, 0.5);

    const status = this.add
      .text(GAME_WIDTH / 2, barY + 36, '리소스 준비 중…', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: { w: 0 },
      w: barW - 8,
      duration: 1100,
      ease: 'Sine.easeInOut',
      onUpdate: (_tween, target) => {
        this.barFill.width = target.w;
      },
      onComplete: () => {
        status.setText('완료');
        this.time.delayedCall(350, () => this.scene.start('LoginScene'));
      },
    });
  }
}
