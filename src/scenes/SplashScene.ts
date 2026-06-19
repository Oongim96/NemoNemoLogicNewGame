import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super('SplashScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const logoBox = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 120, 120, COLORS.accent, 0.15)
      .setStrokeStyle(2, COLORS.accent);

    const logoMark = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'N', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: '#7c5cff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const company = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'NemoNemo Logic', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const tagline = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 112, '픽셀 던전: 잉크 오브 운명', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#8888aa',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    logoBox.setScale(0.6).setAlpha(0);

    this.tweens.add({
      targets: [logoBox, logoMark],
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: [company, tagline],
      alpha: 1,
      duration: 500,
      delay: 400,
    });

    this.tweens.add({
      targets: logoBox,
      scale: 1.04,
      duration: 800,
      delay: 700,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.cameras.main.fadeIn(0);
        this.scene.start('LoadingScene');
      });
    });
  }
}
