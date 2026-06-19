import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@app/game.config';
import { PlayerProfile } from '@modules/meta';
import { fillMobileBackground } from '@ui/mobile-shell';

export class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create(): void {
    fillMobileBackground(this);

    this.add
      .text(GAME_WIDTH / 2, 120, '로그인', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, GAME_WIDTH - 48, 180, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);

    const status = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, '게스트 자동 로그인 중…', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    const detail = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, '세션 확인', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    const spinner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, '◌', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.tweens.add({ targets: spinner, angle: 360, duration: 900, repeat: -1 });

    let profile = this.registry.get('playerProfile') as PlayerProfile | undefined;
    if (!profile) {
      profile = PlayerProfile.createDefault();
      this.registry.set('playerProfile', profile);
    }

    this.time.delayedCall(1200, () => {
      profile!.autoLogin();
      status.setText(`${profile!.getDisplayName()}님, 환영합니다`);
      detail.setText('SR 4인 · 기본 카드 지급');
      spinner.setVisible(false);
      panel.setStrokeStyle(2, 0x3dd68c);

      this.time.delayedCall(600, () => this.scene.start('HubScene'));
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 48, 'Google · Apple · 이메일 (추후)', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#555566',
      })
      .setOrigin(0.5);
  }
}
