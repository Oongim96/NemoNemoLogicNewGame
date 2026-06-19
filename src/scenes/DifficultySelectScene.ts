import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, LAYOUT } from '@app/game.config';
import { DIFFICULTY_OPTIONS, type PlayerProfile } from '@modules/meta';
import { RunState } from '@modules/run';
import { backButton, fillMobileBackground } from '@ui/mobile-shell';

export class DifficultySelectScene extends Phaser.Scene {
  constructor() {
    super('DifficultySelectScene');
  }

  create(): void {
    const profile = this.registry.get('playerProfile') as PlayerProfile;
    fillMobileBackground(this);
    backButton(this, () => this.scene.start('HubScene'));

    this.add
      .text(GAME_WIDTH / 2, LAYOUT.SAFE_TOP + LAYOUT.TOP_BAR / 2, '난이도 선택', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    let y = LAYOUT.CONTENT_TOP + 16;
    const rowW = GAME_WIDTH - 24;

    DIFFICULTY_OPTIONS.forEach((opt) => {
      const rect = this.add
        .rectangle(GAME_WIDTH / 2, y, rowW, 88, COLORS.panel)
        .setStrokeStyle(2, COLORS.accent)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(20, y - 20, opt.label, {
          fontFamily: 'sans-serif',
          fontSize: '20px',
          color: '#f0f0f5',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(20, y + 4, `${opt.mapSize}×${opt.mapSize} 구역 · 퍼즐 ${opt.puzzleLabel}`, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#7c5cff',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(20, y + 26, opt.description, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#8888aa',
        })
        .setOrigin(0, 0.5);

      rect.on('pointerdown', () => {
        this.registry.set(
          'runState',
          RunState.createFresh({ mapSize: opt.mapSize, party: profile.getPartyConfig() }),
        );
        this.registry.set('selectedDifficulty', opt.id);
        this.scene.start('MapScene');
      });

      y += 100;
    });
  }
}
