import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import type { PlayerProfile } from '@modules/meta';
import { drawMobileShell } from '@ui/mobile-shell';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    const settings = profile.getSettings();
    drawMobileShell(this, '설정', 'settings');

    const rows: { key: 'bgmEnabled' | 'sfxEnabled'; label: string }[] = [
      { key: 'bgmEnabled', label: 'BGM' },
      { key: 'sfxEnabled', label: '효과음' },
    ];

    let y = LAYOUT.CONTENT_TOP + 24;
    for (const row of rows) {
      this.add
        .text(24, y, row.label, { fontFamily: 'sans-serif', fontSize: '16px', color: '#f0f0f5' })
        .setOrigin(0, 0.5);

      const toggle = this.add
        .rectangle(GAME_WIDTH - 56, y, 72, 36, settings[row.key] ? 0x3dd68c : 0x555566)
        .setInteractive({ useHandCursor: true });

      const toggleLabel = this.add
        .text(GAME_WIDTH - 56, y, settings[row.key] ? 'ON' : 'OFF', {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#fff',
        })
        .setOrigin(0.5);

      toggle.on('pointerdown', () => {
        const next = !profile.getSettings()[row.key];
        profile.updateSettings({ [row.key]: next });
        toggle.setFillStyle(next ? 0x3dd68c : 0x555566);
        toggleLabel.setText(next ? 'ON' : 'OFF');
      });

      y += 56;
    }

    this.add
      .text(24, y + 8, '언어', { fontFamily: 'sans-serif', fontSize: '16px', color: '#f0f0f5' })
      .setOrigin(0, 0.5);

    const langBtn = this.add
      .rectangle(GAME_WIDTH - 56, y + 8, 72, 36, COLORS.panel)
      .setStrokeStyle(1, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const langLabel = this.add
      .text(GAME_WIDTH - 56, y + 8, settings.language === 'ko' ? '한국어' : 'EN', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5);

    langBtn.on('pointerdown', () => {
      const next = profile.getSettings().language === 'ko' ? 'en' : 'ko';
      profile.updateSettings({ language: next });
      langLabel.setText(next === 'ko' ? '한국어' : 'EN');
    });

    this.add
      .rectangle(GAME_WIDTH / 2, y + 80, GAME_WIDTH - 48, 100, COLORS.panel)
      .setStrokeStyle(1, 0x333344);

    this.add
      .text(GAME_WIDTH / 2, y + 68, '계정', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#7c5cff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, y + 92, `${profile.getDisplayName()} (게스트)\n로그아웃 · 데이터 초기화 (추후)`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8888aa',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
